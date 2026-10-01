const express = require("express");
const Member = require("../models/Member");
const Page = require("../models/Page");
const Progress = require("../models/Progress");
const ReadingHistory = require("../models/ReadingHistory");
const PageView = require("../models/PageView");
const Note = require("../models/Note");
const Notification = require("../models/Notification");
const Revision = require("../models/Revision");
const Comment = require("../models/Comment");
const Rating = require("../models/Rating");
const RoadmapStage = require("../models/RoadmapStage");
const { ensureMember } = require("../middleware/ensureMember");
const { isSlug } = require("../lib/validate");
const { dayKey, weeklyStreak } = require("../lib/days");
const { earnedBadges } = require("../lib/badges");

const router = express.Router();
router.use(ensureMember);

// Roadmap stages in order, each with its topic ids (page slugs).
async function roadmapStages() {
  const [stages, pages] = await Promise.all([
    RoadmapStage.find().sort({ order: 1 }).lean(),
    Page.find({ roadmapStage: { $ne: "" }, hidden: false }).sort({ roadmapOrder: 1, title: 1 }).select("slug title roadmapStage").lean(),
  ]);
  return stages.map((s) => ({
    key: s.key,
    title: s.title,
    label: s.label,
    topics: pages.filter((p) => p.roadmapStage === s.key).map((p) => p.slug),
    titles: Object.fromEntries(pages.filter((p) => p.roadmapStage === s.key).map((p) => [p.slug, p.title])),
  }));
}

// --- Roadmap progress -----------------------------------------------------

router.get("/me/progress", async (req, res, next) => {
  try {
    const doc = await Progress.findOne({ email: req.user.email }).lean();
    res.json({ done: doc ? Object.fromEntries(Object.entries(doc.done || {}).map(([k, v]) => [k, v])) : {} });
  } catch (err) {
    next(err);
  }
});

// Sets one topic, or merges a batch (the one-time upload of progress that was
// only in a browser before progress moved to the server).
router.put("/me/progress", async (req, res, next) => {
  try {
    const set = {};
    const unset = {};
    const apply = (id, done) => {
      if (!isSlug(id)) return;
      if (done) set[`done.${id}`] = new Date();
      else unset[`done.${id}`] = "";
    };
    if (req.body.merge && typeof req.body.merge === "object") {
      // Merging only ever adds ticks — it must never wipe progress made on
      // another device.
      for (const [id, done] of Object.entries(req.body.merge).slice(0, 500)) if (done) apply(id, true);
    } else {
      apply(req.body.id, Boolean(req.body.done));
    }
    if (req.body.reset === true) {
      await Progress.updateOne({ email: req.user.email }, { $set: { done: {} } }, { upsert: true });
    } else if (Object.keys(set).length || Object.keys(unset).length) {
      // A field can't be in both; a later write for the same id wins.
      for (const k of Object.keys(set)) delete unset[k];
      const update = {};
      if (Object.keys(set).length) update.$set = set;
      if (Object.keys(unset).length) update.$unset = unset;
      await Progress.updateOne({ email: req.user.email }, update, { upsert: true });
    }
    const doc = await Progress.findOne({ email: req.user.email }).lean();
    res.json({ done: doc?.done || {} });
  } catch (err) {
    next(err);
  }
});

// --- Reading history --------------------------------------------------------

// Called when a member opens a page and again (throttled) as they scroll.
// `view: true` marks a fresh visit, which is what analytics counts.
router.post("/me/reading", async (req, res, next) => {
  try {
    const { slug } = req.body;
    if (!isSlug(slug)) return res.status(400).json({ error: "A page slug is required." });
    const now = new Date();
    // A plain "opened the page" ping leaves the saved position alone, so
    // reopening a page doesn't forget how far down it you'd got.
    const set = { readAt: now };
    if (typeof req.body.scroll === "number") set.scroll = Math.min(1, Math.max(0, req.body.scroll));
    await ReadingHistory.updateOne({ email: req.user.email, slug }, { $set: set }, { upsert: true });
    if (req.body.view === true) {
      await PageView.updateOne(
        { slug, day: dayKey(now) },
        { $inc: { views: 1 }, $addToSet: { readers: req.user.email } },
        { upsert: true }
      );
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get("/me/recent", async (req, res, next) => {
  try {
    const rows = await ReadingHistory.find({ email: req.user.email }).sort({ readAt: -1 }).limit(12).lean();
    const pages = await Page.find({ slug: { $in: rows.map((r) => r.slug) }, hidden: false }).select("slug title section").lean();
    const bySlug = new Map(pages.map((p) => [p.slug, p]));
    res.json({
      recent: rows
        .filter((r) => bySlug.has(r.slug))
        .slice(0, 6)
        .map((r) => ({ slug: r.slug, title: bySlug.get(r.slug).title, scroll: r.scroll, readAt: r.readAt })),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/me/reading", async (req, res, next) => {
  try {
    if (!isSlug(req.query.slug)) return res.status(400).json({ error: "A page slug is required." });
    const r = await ReadingHistory.findOne({ email: req.user.email, slug: req.query.slug }).lean();
    res.json({ scroll: r?.scroll || 0, readAt: r?.readAt || null });
  } catch (err) {
    next(err);
  }
});

// --- Private notes ------------------------------------------------------------

router.get("/me/notes", async (req, res, next) => {
  try {
    if (req.query.slug !== undefined) {
      if (!isSlug(req.query.slug)) return res.status(400).json({ error: "A page slug is required." });
      const n = await Note.findOne({ email: req.user.email, slug: req.query.slug }).lean();
      return res.json({ note: n ? { body: n.body, updatedAt: n.updatedAt } : null });
    }
    const notes = await Note.find({ email: req.user.email, body: { $ne: "" } }).sort({ updatedAt: -1 }).limit(200).lean();
    const titles = new Map(
      (await Page.find({ slug: { $in: notes.map((n) => n.slug) } }).select("slug title").lean()).map((p) => [p.slug, p.title])
    );
    res.json({
      notes: notes.map((n) => ({ slug: n.slug, title: titles.get(n.slug) || n.slug, body: n.body, updatedAt: n.updatedAt })),
    });
  } catch (err) {
    next(err);
  }
});

router.put("/me/notes", async (req, res, next) => {
  try {
    const { slug } = req.body;
    if (!isSlug(slug)) return res.status(400).json({ error: "A page slug is required." });
    const body = typeof req.body.body === "string" ? req.body.body : "";
    if (body.length > 20000) return res.status(400).json({ error: "Notes are limited to 20,000 characters." });
    if (!body.trim()) {
      await Note.deleteOne({ email: req.user.email, slug });
      return res.json({ note: null });
    }
    const n = await Note.findOneAndUpdate(
      { email: req.user.email, slug },
      { $set: { body } },
      { upsert: true, new: true }
    ).lean();
    res.json({ note: { body: n.body, updatedAt: n.updatedAt } });
  } catch (err) {
    next(err);
  }
});

// --- Profile: streak, badges, settings -----------------------------------------

router.get("/me/profile", async (req, res, next) => {
  try {
    const email = req.user.email;
    const [member, progress, stages, revAgg, comments, ratings] = await Promise.all([
      Member.findOne({ collegeEmail: email }).select("name collegeEmail role activeDays shareProgress emailReminders createdAt").lean(),
      Progress.findOne({ email }).lean(),
      roadmapStages(),
      Revision.aggregate([
        { $match: { authorEmail: email, seeded: { $ne: true }, excludeFromStats: { $ne: true } } },
        { $group: { _id: null, words: { $sum: "$wordsAdded" }, edits: { $sum: 1 } } },
      ]),
      Comment.countDocuments({ authorEmail: email, deleted: false }),
      Rating.countDocuments({ email }),
    ]);
    const doneIds = new Set(Object.keys(progress?.done || {}));
    const streak = weeklyStreak(member?.activeDays || []);
    const total = stages.reduce((n, s) => n + s.topics.length, 0);
    const done = stages.reduce((n, s) => n + s.topics.filter((t) => doneIds.has(t)).length, 0);

    res.json({
      name: member?.name,
      email,
      role: member?.role,
      memberSince: member?.createdAt,
      streak,
      activeDays: (member?.activeDays || []).slice(-120),
      progress: { done, total },
      stats: { wordsAdded: revAgg[0]?.words || 0, edits: revAgg[0]?.edits || 0, comments, ratings },
      badges: earnedBadges({
        doneIds,
        stages,
        wordsAdded: revAgg[0]?.words || 0,
        edits: revAgg[0]?.edits || 0,
        comments,
        streak,
        ratings,
      }),
      settings: { shareProgress: Boolean(member?.shareProgress), emailReminders: member?.emailReminders !== false },
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/me/settings", async (req, res, next) => {
  try {
    const set = {};
    if (typeof req.body.shareProgress === "boolean") set.shareProgress = req.body.shareProgress;
    if (typeof req.body.emailReminders === "boolean") set.emailReminders = req.body.emailReminders;
    if (!Object.keys(set).length) return res.status(400).json({ error: "Nothing to change." });
    const m = await Member.findOneAndUpdate({ collegeEmail: req.user.email }, { $set: set }, { new: true })
      .select("shareProgress emailReminders")
      .lean();
    res.json({ settings: { shareProgress: Boolean(m.shareProgress), emailReminders: m.emailReminders !== false } });
  } catch (err) {
    next(err);
  }
});

// --- Learning alongside you ------------------------------------------------------

// Members who opted in, grouped by the stage they're currently working
// through (their first unfinished stage). Nobody appears without opting in.
router.get("/peers", async (req, res, next) => {
  try {
    const [stages, sharers] = await Promise.all([
      roadmapStages(),
      Member.find({ active: true, shareProgress: true }).select("name collegeEmail lastActiveAt").lean(),
    ]);
    const progress = await Progress.find({ email: { $in: sharers.map((m) => m.collegeEmail) } }).lean();
    const doneOf = new Map(progress.map((p) => [p.email, new Set(Object.keys(p.done || {}))]));

    const groups = stages.map((s) => ({ key: s.key, title: s.title, label: s.label, members: [] }));
    const finished = [];
    for (const m of sharers) {
      const done = doneOf.get(m.collegeEmail) || new Set();
      const idx = stages.findIndex((s) => s.topics.some((t) => !done.has(t)));
      const entry = {
        name: m.name,
        you: m.collegeEmail === req.user.email,
        done: stages.reduce((n, s) => n + s.topics.filter((t) => done.has(t)).length, 0),
        recentlyActive: Boolean(m.lastActiveAt && Date.now() - new Date(m.lastActiveAt).getTime() < 7 * 86400000),
      };
      if (idx === -1) finished.push(entry);
      else groups[idx].members.push(entry);
    }
    for (const g of groups) g.members.sort((a, b) => b.recentlyActive - a.recentlyActive || b.done - a.done);
    const me = await Member.findOne({ collegeEmail: req.user.email }).select("shareProgress").lean();
    res.json({ groups, finished, sharing: Boolean(me?.shareProgress) });
  } catch (err) {
    next(err);
  }
});

// --- Notifications -----------------------------------------------------------------

router.get("/me/notifications", async (req, res, next) => {
  try {
    const [items, unread] = await Promise.all([
      Notification.find({ email: req.user.email }).sort({ createdAt: -1 }).limit(30).lean(),
      Notification.countDocuments({ email: req.user.email, read: false }),
    ]);
    res.json({ items, unread });
  } catch (err) {
    next(err);
  }
});

// Just the count, for the bell's periodic check — cheap enough to poll.
router.get("/me/notifications/count", async (req, res, next) => {
  try {
    res.json({ unread: await Notification.countDocuments({ email: req.user.email, read: false }) });
  } catch (err) {
    next(err);
  }
});

router.post("/me/notifications/read", async (req, res, next) => {
  try {
    const filter = { email: req.user.email, read: false };
    if (req.body.id) {
      if (!/^[a-f0-9]{24}$/.test(String(req.body.id))) return res.status(400).json({ error: "Malformed id." });
      filter._id = req.body.id;
    }
    await Notification.updateMany(filter, { $set: { read: true } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
