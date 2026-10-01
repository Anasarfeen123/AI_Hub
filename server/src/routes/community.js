const express = require("express");
const mongoose = require("mongoose");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const Page = require("../models/Page");
const Member = require("../models/Member");
const Rating = require("../models/Rating");
const PageFlag = require("../models/PageFlag");
const Suggestion = require("../models/Suggestion");
const AccessRequest = require("../models/AccessRequest");
const { ensureMember, ensureAdmin } = require("../middleware/ensureMember");
const { isSlug } = require("../lib/validate");
const { audit } = require("../lib/audit");
const { notify } = require("../lib/notify");
const { publishEdit } = require("../lib/publish");
const { sendMail } = require("../lib/mailer");

const router = express.Router();

const staffEmails = async () =>
  (await Member.find({ active: true, role: { $in: ["admin", "superadmin"] } }).select("collegeEmail").lean()).map((m) => m.collegeEmail);

const validId = (id) => mongoose.isValidObjectId(id);

// --- "This helped me" on resource links --------------------------------------

router.get("/ratings", ensureMember, async (req, res, next) => {
  try {
    if (!isSlug(req.query.slug)) return res.status(400).json({ error: "A page slug is required." });
    const rows = await Rating.aggregate([
      { $match: { slug: req.query.slug } },
      { $group: { _id: "$url", count: { $sum: 1 }, emails: { $push: "$email" } } },
    ]);
    const ratings = {};
    for (const r of rows) ratings[r._id] = { count: r.count, mine: r.emails.includes(req.user.email) };
    res.json({ ratings });
  } catch (err) {
    next(err);
  }
});

router.post("/ratings", ensureMember, async (req, res, next) => {
  try {
    const { slug, url } = req.body;
    if (!isSlug(slug)) return res.status(400).json({ error: "A page slug is required." });
    if (typeof url !== "string" || !/^https?:\/\//i.test(url) || url.length > 2000) {
      return res.status(400).json({ error: "Only web links can be rated." });
    }
    const key = { slug, url, email: req.user.email };
    if (req.body.helpful === false) await Rating.deleteOne(key);
    else await Rating.updateOne(key, { $setOnInsert: key }, { upsert: true });
    const count = await Rating.countDocuments({ slug, url });
    res.json({ count, mine: req.body.helpful !== false });
  } catch (err) {
    next(err);
  }
});

// --- "This page needs help" flags ---------------------------------------------

const FLAG_LABELS = {
  outdated: "is out of date",
  incomplete: "is missing something",
  "broken-link": "has a broken link",
  unclear: "is hard to follow",
  other: "needs attention",
};

router.get("/flags", ensureMember, async (req, res, next) => {
  try {
    const filter = { resolved: false };
    if (req.query.slug !== undefined) {
      if (!isSlug(req.query.slug)) return res.status(400).json({ error: "A page slug is required." });
      filter.slug = req.query.slug;
    }
    const flags = await PageFlag.find(filter).sort({ createdAt: -1 }).limit(300).lean();
    const titles = new Map(
      (await Page.find({ slug: { $in: [...new Set(flags.map((f) => f.slug))] } }).select("slug title").lean()).map((p) => [p.slug, p.title])
    );
    res.json({
      flags: flags
        .filter((f) => titles.has(f.slug))
        .map((f) => ({
          _id: f._id,
          slug: f.slug,
          title: titles.get(f.slug),
          kind: f.kind,
          note: f.note,
          createdByName: f.createdByName,
          mine: f.createdBy === req.user.email,
          createdAt: f.createdAt,
        })),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/flags", ensureMember, async (req, res, next) => {
  try {
    const { slug, kind } = req.body;
    if (!isSlug(slug)) return res.status(400).json({ error: "A page slug is required." });
    if (!FLAG_LABELS[kind]) return res.status(400).json({ error: "Pick what's wrong with the page." });
    const note = typeof req.body.note === "string" ? req.body.note.trim().slice(0, 500) : "";
    const page = await Page.findOne({ slug }).select("slug title updatedBy").lean();
    if (!page) return res.status(404).json({ error: "Page not found." });

    // One open flag of each kind per member per page is plenty.
    const existing = await PageFlag.findOne({ slug, kind, createdBy: req.user.email, resolved: false });
    if (existing) {
      existing.note = note || existing.note;
      await existing.save();
      return res.json({ flag: existing });
    }
    const flag = await PageFlag.create({ slug, kind, note, createdBy: req.user.email, createdByName: req.user.name });
    if (page.updatedBy && page.updatedBy !== req.user.email) {
      await notify(page.updatedBy, {
        type: "flag",
        text: `${req.user.name} says "${page.title}" ${FLAG_LABELS[kind]}`,
        link: `/${slug}`,
        key: `flag:${slug}`,
      });
    }
    res.status(201).json({ flag });
  } catch (err) {
    next(err);
  }
});

// The person who raised a flag, or any admin, can mark it resolved.
router.post("/flags/:id/resolve", ensureMember, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: "Malformed id." });
    const flag = await PageFlag.findById(req.params.id);
    if (!flag || flag.resolved) return res.status(404).json({ error: "That flag is already resolved." });
    const staff = ["admin", "superadmin"].includes(req.user.role);
    if (!staff && flag.createdBy !== req.user.email) {
      return res.status(403).json({ error: "Only the person who raised it, or an admin, can resolve this." });
    }
    flag.resolved = true;
    flag.resolvedBy = req.user.email;
    flag.resolvedAt = new Date();
    await flag.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// --- Suggested edits ----------------------------------------------------------

router.post("/suggestions", ensureMember, async (req, res, next) => {
  try {
    const { slug, body } = req.body;
    if (!isSlug(slug)) return res.status(400).json({ error: "A page slug is required." });
    if (typeof body !== "string" || !body.trim()) return res.status(400).json({ error: "The suggestion is empty." });
    if (body.length > 500000) return res.status(400).json({ error: "That's too long to suggest in one go." });
    const page = await Page.findOne({ slug }).select("slug title body updatedAt").lean();
    if (!page) return res.status(404).json({ error: "Page not found." });
    if (page.body === body) return res.status(400).json({ error: "No changes to suggest." });

    const s = await Suggestion.create({
      slug,
      body,
      baseUpdatedAt: req.body.baseUpdatedAt ? new Date(req.body.baseUpdatedAt) : page.updatedAt,
      summary: typeof req.body.summary === "string" ? req.body.summary.slice(0, 300) : "",
      authorEmail: req.user.email,
      authorName: req.user.name,
    });
    const pending = await Suggestion.countDocuments({ status: "pending" });
    await notify(await staffEmails(), {
      type: "suggestion",
      text: `${pending} suggested edit${pending === 1 ? "" : "s"} waiting for review — latest on "${page.title}"`,
      link: "/admin/suggestions",
      key: "suggestions-pending",
    });
    res.status(201).json({ suggestion: { _id: s._id } });
  } catch (err) {
    next(err);
  }
});

// A member's own suggestions and how they went.
router.get("/suggestions/mine", ensureMember, async (req, res, next) => {
  try {
    const list = await Suggestion.find({ authorEmail: req.user.email }).sort({ createdAt: -1 }).limit(50).select("-body").lean();
    const titles = new Map(
      (await Page.find({ slug: { $in: list.map((s) => s.slug) } }).select("slug title").lean()).map((p) => [p.slug, p.title])
    );
    res.json({ suggestions: list.map((s) => ({ ...s, title: titles.get(s.slug) || s.slug })) });
  } catch (err) {
    next(err);
  }
});

router.get("/suggestions", ensureAdmin, async (req, res, next) => {
  try {
    const status = ["pending", "approved", "rejected"].includes(req.query.status) ? req.query.status : "pending";
    const list = await Suggestion.find({ status }).sort({ createdAt: status === "pending" ? 1 : -1 }).limit(100).lean();
    const pages = await Page.find({ slug: { $in: list.map((s) => s.slug) } }).select("slug title body updatedAt").lean();
    const bySlug = new Map(pages.map((p) => [p.slug, p]));
    res.json({
      suggestions: list.map((s) => {
        const page = bySlug.get(s.slug);
        return {
          ...s,
          title: page?.title || s.slug,
          current: page?.body ?? null,
          // The page changed after the suggestion was written; the reviewer
          // should check it doesn't undo someone else's newer edit.
          stale: Boolean(page && s.baseUpdatedAt && new Date(page.updatedAt).getTime() > new Date(s.baseUpdatedAt).getTime()),
        };
      }),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/suggestions/:id/:decision(approve|reject)", ensureAdmin, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: "Malformed id." });
    const s = await Suggestion.findById(req.params.id);
    if (!s || s.status !== "pending") return res.status(404).json({ error: "That suggestion was already reviewed." });
    const note = typeof req.body.note === "string" ? req.body.note.trim().slice(0, 500) : "";
    const page = await Page.findOne({ slug: s.slug });
    if (!page) return res.status(404).json({ error: "The page no longer exists." });

    if (req.params.decision === "approve") {
      if (page.body === s.body) return res.status(400).json({ error: "The page already has exactly this text." });
      // Credit goes to the person who wrote it; the reviewer is the publisher.
      await publishEdit({
        page,
        body: s.body,
        summary: s.summary || "Suggested edit",
        author: { email: s.authorEmail, name: s.authorName },
        publisherEmail: req.user.email,
      });
    }
    s.status = req.params.decision === "approve" ? "approved" : "rejected";
    s.reviewedBy = req.user.email;
    s.reviewNote = note;
    s.reviewedAt = new Date();
    await s.save();

    await audit(req, s.status === "approved" ? "Approved a suggested edit" : "Declined a suggested edit", page.title, `by ${s.authorName}`);
    await notify(s.authorEmail, {
      type: "suggestion",
      text:
        s.status === "approved"
          ? `Your suggested edit to "${page.title}" was approved and is live 🎉`
          : `Your suggested edit to "${page.title}" wasn't accepted${note ? `: ${note}` : "."}`,
      link: `/${page.slug}`,
    });
    res.json({ ok: true, status: s.status });
  } catch (err) {
    next(err);
  }
});

// --- Access requests (public) ---------------------------------------------------

// Tight, per-address limit: this is the one write anyone on the internet can make.
const requestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  skip: () => process.env.NODE_ENV === "development",
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests from here — try again in an hour." },
});

router.post("/access-requests", requestLimiter, async (req, res, next) => {
  try {
    // Hidden field a person never sees; bots that fill every input do.
    if (req.body.website) return res.status(201).json({ ok: true });
    const name = typeof req.body.name === "string" ? req.body.name.trim().slice(0, 100) : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase().slice(0, 200) : "";
    const note = typeof req.body.note === "string" ? req.body.note.trim().slice(0, 500) : "";
    if (!name) return res.status(400).json({ error: "Please add your name." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "That doesn't look like an email address." });

    // Same answer whether or not they're already a member or already asked,
    // so the form can't be used to probe who's on the list.
    const [member, pending] = await Promise.all([
      Member.exists({ collegeEmail: email }),
      AccessRequest.exists({ email, status: "pending" }),
    ]);
    if (!member && !pending) {
      await AccessRequest.create({ name, email, note });
      const count = await AccessRequest.countDocuments({ status: "pending" });
      await notify(await staffEmails(), {
        type: "access",
        text: `${count} access request${count === 1 ? "" : "s"} waiting — latest from ${name}`,
        link: "/admin/members?view=requests",
        key: "access-requests",
      });
    }
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get("/access-requests", ensureAdmin, async (_req, res, next) => {
  try {
    res.json({ requests: await AccessRequest.find({ status: "pending" }).sort({ createdAt: 1 }).limit(200).lean() });
  } catch (err) {
    next(err);
  }
});

router.post("/access-requests/:id/:decision(approve|decline)", ensureAdmin, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: "Malformed id." });
    const r = await AccessRequest.findById(req.params.id);
    if (!r || r.status !== "pending") return res.status(404).json({ error: "That request was already handled." });

    let emailed = false;
    if (req.params.decision === "approve") {
      await Member.updateOne(
        { collegeEmail: r.email },
        { $setOnInsert: { name: r.name, collegeEmail: r.email }, $set: { active: true } },
        { upsert: true }
      );
      const site = process.env.CLIENT_URL || "";
      try {
        ({ sent: emailed } = await sendMail({
          to: r.email,
          subject: "You're in — welcome to the MIC AI/ML Resource Hub",
          heading: `Welcome, ${r.name.split(" ")[0]}!`,
          paragraphs: [
            "Your request to join the AI/ML Resource Hub was approved.",
            `Sign in with Google using ${r.email} — that's the address on the member list.`,
          ],
          buttonText: "Open the hub",
          buttonUrl: site,
        }));
      } catch (err) {
        console.error("welcome email failed:", err.message);
      }
    }
    r.status = req.params.decision === "approve" ? "approved" : "declined";
    r.reviewedBy = req.user.email;
    r.reviewedAt = new Date();
    await r.save();
    await audit(req, r.status === "approved" ? "Approved access request" : "Declined access request", `${r.name} <${r.email}>`);
    res.json({ ok: true, emailed });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
