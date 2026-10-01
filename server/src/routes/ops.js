const express = require("express");
const crypto = require("crypto");
const dns = require("dns").promises;
const net = require("net");
const Page = require("../models/Page");
const Member = require("../models/Member");
const Progress = require("../models/Progress");
const PageView = require("../models/PageView");
const LinkCheck = require("../models/LinkCheck");
const Announcement = require("../models/Announcement");
const RoadmapStage = require("../models/RoadmapStage");
const { ensureAdmin } = require("../middleware/ensureMember");
const { audit } = require("../lib/audit");
const { dayKey } = require("../lib/days");
const { sendMail, mailConfigured } = require("../lib/mailer");

const router = express.Router();
const DAY = 86400000;

// --- Announcement history ---------------------------------------------------------

router.get("/announcements", ensureAdmin, async (_req, res, next) => {
  try {
    res.json({ announcements: await Announcement.find().sort({ createdAt: -1 }).limit(30).lean() });
  } catch (err) {
    next(err);
  }
});

// --- Page analytics ---------------------------------------------------------------

router.get("/admin/analytics", ensureAdmin, async (req, res, next) => {
  try {
    const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30;
    const since = dayKey(new Date(Date.now() - (days - 1) * DAY));

    const [perPage, perDay, pages, stages, roadmapPages, progress, activeMembers] = await Promise.all([
      PageView.aggregate([
        { $match: { day: { $gte: since } } },
        { $group: { _id: "$slug", views: { $sum: "$views" }, readers: { $addToSet: "$readers" } } },
      ]),
      PageView.aggregate([
        { $match: { day: { $gte: since } } },
        { $group: { _id: "$day", views: { $sum: "$views" }, readers: { $addToSet: "$readers" } } },
        { $sort: { _id: 1 } },
      ]),
      Page.find({ hidden: false }).select("slug title").lean(),
      RoadmapStage.find().sort({ order: 1 }).lean(),
      Page.find({ roadmapStage: { $ne: "" }, hidden: false }).sort({ roadmapOrder: 1, title: 1 }).select("slug title roadmapStage").lean(),
      Progress.find().lean(),
      Member.countDocuments({ active: true }),
    ]);

    // readers comes back as an array of daily arrays; flatten to unique people.
    const uniq = (nested) => new Set(nested.flat()).size;
    const titles = new Map(pages.map((p) => [p.slug, p.title]));
    const topPages = perPage
      .filter((r) => titles.has(r._id))
      .map((r) => ({ slug: r._id, title: titles.get(r._id), views: r.views, readers: uniq(r.readers) }))
      .sort((a, b) => b.readers - a.readers || b.views - a.views);
    const viewedSlugs = new Set(topPages.map((p) => p.slug));
    const unread = pages.filter((p) => !viewedSlugs.has(p.slug)).map((p) => ({ slug: p.slug, title: p.title }));

    // Every day in the window, including quiet ones, so the chart has no gaps.
    const byDay = new Map(perDay.map((d) => [d._id, d]));
    const daily = [];
    for (let i = days - 1; i >= 0; i--) {
      const k = dayKey(new Date(Date.now() - i * DAY));
      const d = byDay.get(k);
      daily.push({ day: k, views: d?.views || 0, readers: d ? uniq(d.readers) : 0 });
    }

    // The roadmap as a funnel: for each topic in order, how many members have
    // ever opened it and how many ticked it done. Where the numbers fall off is
    // where people get stuck.
    const everRead = await PageView.aggregate([
      { $match: { slug: { $in: roadmapPages.map((p) => p.slug) } } },
      { $unwind: "$readers" },
      { $group: { _id: "$slug", readers: { $addToSet: "$readers" } } },
    ]);
    const readCount = new Map(everRead.map((r) => [r._id, r.readers.length]));
    const doneCount = new Map();
    for (const p of progress) for (const id of Object.keys(p.done || {})) doneCount.set(id, (doneCount.get(id) || 0) + 1);
    const funnel = stages.map((s) => ({
      stage: s.title,
      label: s.label,
      topics: roadmapPages
        .filter((p) => p.roadmapStage === s.key)
        .map((p) => ({ slug: p.slug, title: p.title, read: readCount.get(p.slug) || 0, done: doneCount.get(p.slug) || 0 })),
    }));

    res.json({
      days,
      totals: {
        views: daily.reduce((n, d) => n + d.views, 0),
        readers: uniq(perDay.map((d) => d.readers.flat())),
        activeMembers,
      },
      daily,
      topPages: topPages.slice(0, 15),
      unread,
      funnel,
    });
  } catch (err) {
    next(err);
  }
});

// --- Link checker -----------------------------------------------------------------

// One check runs at a time, in the background; the admin page polls status.
const linkJob = { running: false, startedAt: null, finishedAt: null, checked: 0, total: 0, startedBy: "" };

function extractLinks(md) {
  const out = new Set();
  const re = /\]\((https?:\/\/[^\s)]+)\)|<(https?:\/\/[^\s>]+)>|(?:^|\s)(https?:\/\/[^\s<)\]]+)/g;
  let m;
  while ((m = re.exec(md || ""))) {
    const url = (m[1] || m[2] || m[3]).replace(/[.,;:!?'"]+$/, "");
    out.add(url);
  }
  return out;
}

// Links come from page text any member can edit, so the checker must never be
// steered at the server's own network (localhost, cloud metadata, private
// ranges). Every hop, redirects included, is resolved and checked first.
function isPrivateAddress(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 || a === 127 || a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateAddress(v6.slice(7));
  return v6 === "::1" || v6 === "::" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
}

async function assertPublic(url) {
  const { protocol, hostname } = new URL(url);
  if (!/^https?:$/.test(protocol)) throw Object.assign(new Error("Not a web link"), { skip: true });
  const host = hostname.replace(/^\[|\]$/g, "");
  const addrs = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true });
  if (addrs.some((a) => isPrivateAddress(a.address))) throw Object.assign(new Error("Private address — not checked"), { skip: true });
}

async function probe(url) {
  const attempt = async (method) => {
    let current = url;
    // Follow redirects by hand so each hop gets the same address check.
    for (let hop = 0; hop < 5; hop++) {
      await assertPublic(current);
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10000);
      let r;
      try {
        r = await fetch(current, {
          method,
          redirect: "manual",
          signal: ctrl.signal,
          headers: { "User-Agent": "Mozilla/5.0 (compatible; MIC-AI-Hub-LinkChecker/1.0)", Accept: "text/html,*/*" },
        });
      } finally {
        clearTimeout(timer);
      }
      const next = r.status >= 300 && r.status < 400 ? r.headers.get("location") : null;
      if (!next) return r;
      current = new URL(next, current).toString();
    }
    return { ok: false, status: 310 };
  };
  try {
    let r = await attempt("HEAD");
    // Plenty of servers reject HEAD; ask properly before calling it broken.
    if (r.status >= 400) r = await attempt("GET");
    if (r.ok) return { state: "ok", status: r.status };
    // 404/410 means gone. 401/403/429/5xx usually means "not for bots" or a
    // blip, which a person should check rather than us declaring it dead.
    if (r.status === 404 || r.status === 410) return { state: "broken", status: r.status };
    return { state: "unknown", status: r.status };
  } catch (err) {
    if (err.skip) return { state: "unknown", status: 0, error: err.message };
    const msg = err.name === "AbortError" ? "Timed out" : err.cause?.code || err.code || err.message;
    // A domain that doesn't resolve is genuinely broken; a timeout may not be.
    const broken = /ENOTFOUND|EAI_AGAIN|ERR_INVALID_URL|CERT/.test(msg);
    return { state: broken ? "broken" : "unknown", status: 0, error: String(msg).slice(0, 120) };
  }
}

async function runLinkCheck(startedBy) {
  if (linkJob.running) return false;
  Object.assign(linkJob, { running: true, startedAt: new Date(), finishedAt: null, checked: 0, total: 0, startedBy });
  try {
    const pages = await Page.find({ hidden: false }).select("slug body").lean();
    const where = new Map();
    for (const p of pages) for (const url of extractLinks(p.body)) where.set(url, [...(where.get(url) || []), p.slug]);
    const urls = [...where.keys()];
    linkJob.total = urls.length;

    let i = 0;
    const worker = async () => {
      while (i < urls.length) {
        const url = urls[i++];
        const result = await probe(url);
        await LinkCheck.updateOne(
          { url },
          { $set: { ...result, error: result.error || "", pages: where.get(url), checkedAt: new Date() } },
          { upsert: true }
        );
        linkJob.checked++;
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
    // Links no longer on any page are dropped from the report.
    await LinkCheck.deleteMany({ url: { $nin: urls } });
  } catch (err) {
    console.error("link check failed:", err);
  } finally {
    linkJob.running = false;
    linkJob.finishedAt = new Date();
  }
  return true;
}

router.post("/admin/links/check", ensureAdmin, async (req, res) => {
  if (linkJob.running) return res.status(409).json({ error: "A check is already running." });
  runLinkCheck(req.user.email);
  await audit(req, "Started a link check");
  res.status(202).json({ ok: true });
});

router.get("/admin/links", ensureAdmin, async (_req, res, next) => {
  try {
    const results = await LinkCheck.find({ state: { $ne: "ok" } }).sort({ state: 1, url: 1 }).lean();
    const [ok, lastChecked] = await Promise.all([
      LinkCheck.countDocuments({ state: "ok" }),
      LinkCheck.findOne().sort({ checkedAt: -1 }).select("checkedAt").lean(),
    ]);
    const titles = new Map((await Page.find().select("slug title").lean()).map((p) => [p.slug, p.title]));
    res.json({
      job: linkJob,
      ok,
      lastChecked: lastChecked?.checkedAt || null,
      results: results.map((r) => ({ ...r, pages: r.pages.map((s) => ({ slug: s, title: titles.get(s) || s })) })),
    });
  } catch (err) {
    next(err);
  }
});

// --- Reminder emails ---------------------------------------------------------------

const QUIET_DAYS = 14;

async function inactiveMembers() {
  const cutoff = new Date(Date.now() - QUIET_DAYS * DAY);
  return Member.find({
    active: true,
    emailReminders: { $ne: false },
    $and: [
      { $or: [{ lastActiveAt: null }, { lastActiveAt: { $lt: cutoff } }] },
      // Never more than one reminder a fortnight per person.
      { $or: [{ lastReminderAt: null }, { lastReminderAt: { $lt: cutoff } }] },
    ],
  })
    .select("name collegeEmail lastActiveAt")
    .lean();
}

async function sendReminders() {
  const people = await inactiveMembers();
  const site = process.env.CLIENT_URL || "";
  let sent = 0;
  const failed = [];
  for (const m of people) {
    const first = m.name.split(" ")[0];
    try {
      const r = await sendMail({
        to: m.collegeEmail,
        subject: m.lastActiveAt ? "Pick up where you left off on the AI/ML Hub" : "Your AI/ML Resource Hub access is ready",
        heading: m.lastActiveAt ? `Hey ${first}, it's been a while 👋` : `Hey ${first}, you're on the list 👋`,
        paragraphs: m.lastActiveAt
          ? [
              "Your roadmap is right where you left it. Even 20 minutes this week keeps the momentum going.",
              "There may be new pages, discussions or announcements since your last visit.",
            ]
          : [
              "You've been added to the MIC AI/ML Resource Hub — one clear path from Python basics to research papers.",
              `Sign in with Google using ${m.collegeEmail}.`,
            ],
        buttonText: "Open the hub",
        buttonUrl: site,
        footer: "Don't want these? Turn off reminder emails on your profile page in the hub.",
      });
      if (!r.sent) return { configured: false, sent, failed, eligible: people.length };
      await Member.updateOne({ _id: m._id }, { $set: { lastReminderAt: new Date() } });
      sent++;
    } catch (err) {
      failed.push(m.collegeEmail);
      console.error("reminder failed for", m.collegeEmail, err.message);
    }
  }
  return { configured: true, sent, failed, eligible: people.length };
}

router.get("/admin/reminders", ensureAdmin, async (_req, res, next) => {
  try {
    const people = await inactiveMembers();
    res.json({
      configured: mailConfigured(),
      quietDays: QUIET_DAYS,
      eligible: people.map((m) => ({ name: m.name, email: m.collegeEmail, lastActiveAt: m.lastActiveAt })),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/admin/reminders/send", ensureAdmin, async (req, res, next) => {
  try {
    if (!mailConfigured()) return res.status(400).json({ error: "Email isn't set up yet — add the SMTP settings in Render first." });
    const result = await sendReminders();
    await audit(req, "Sent reminder emails", `${result.sent} sent`, result.failed.length ? `${result.failed.length} failed` : "");
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// --- Scheduled jobs ------------------------------------------------------------------

// Render's free tier sleeps, so nothing inside the app can run on a timer.
// A GitHub Actions schedule calls this instead (see .github/workflows), with a
// shared secret. Without CRON_SECRET set, the endpoint doesn't exist at all.
router.post("/cron/:job(weekly)", async (req, res, next) => {
  try {
    // Trimmed on both sides: a stray space or newline from pasting the value
    // into Render or GitHub shouldn't make the two silently disagree.
    const secret = (process.env.CRON_SECRET || "").trim();
    const given = String(req.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    const ok =
      secret.length >= 16 &&
      given.length === secret.length &&
      crypto.timingSafeEqual(Buffer.from(given), Buffer.from(secret));
    if (!ok) return res.status(404).json({ error: "Unknown API route." });

    const reminders = mailConfigured() ? await sendReminders() : { configured: false };
    runLinkCheck("scheduled");
    res.json({ ok: true, reminders, linkCheck: "started" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
