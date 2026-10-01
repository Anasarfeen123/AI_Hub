const express = require("express");
const Member = require("../models/Member");
const Page = require("../models/Page");
const Revision = require("../models/Revision");
const Comment = require("../models/Comment");
const Bookmark = require("../models/Bookmark");
const AuditLog = require("../models/AuditLog");
const Announcement = require("../models/Announcement");
const { ensureMember, ensureAdmin } = require("../middleware/ensureMember");
const { audit } = require("../lib/audit");
const { notify } = require("../lib/notify");

const router = express.Router();
const DAY = 24 * 60 * 60 * 1000;

// --- Announcements --------------------------------------------------------

// The one live notice, for every member's home page.
router.get("/announcement", ensureMember, async (_req, res, next) => {
  try {
    const now = new Date();
    const a = await Announcement.findOne({
      active: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .sort({ createdAt: -1 })
      .lean();
    res.json({
      announcement: a
        ? { _id: a._id, text: a.text, link: a.link, tone: a.tone, createdAt: a.createdAt, createdByName: a.createdByName }
        : null,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/announcements", ensureAdmin, async (req, res, next) => {
  try {
    const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
    const link = typeof req.body.link === "string" ? req.body.link.trim() : "";
    const tone = ["info", "success", "warning"].includes(req.body.tone) ? req.body.tone : "info";
    const days = Number(req.body.days);

    if (!text) return res.status(400).json({ error: "Write the announcement first." });
    if (text.length > 280) return res.status(400).json({ error: "Keep it under 280 characters." });
    // Only web links or in-app paths, so a notice can't carry a javascript: URL.
    if (link && !/^(https?:\/\/|\/)/i.test(link)) {
      return res.status(400).json({ error: "The link must start with https:// or /." });
    }

    await Announcement.updateMany({ active: true }, { $set: { active: false } });
    const a = await Announcement.create({
      text,
      link,
      tone,
      expiresAt: days > 0 && days <= 365 ? new Date(Date.now() + days * DAY) : null,
      createdBy: req.user.email,
      createdByName: req.user.name,
    });
    await audit(req, "Posted announcement", text.slice(0, 120));
    const everyone = await Member.find({ active: true, collegeEmail: { $ne: req.user.email } }).select("collegeEmail").lean();
    await notify(
      everyone.map((m) => m.collegeEmail),
      { type: "announcement", text: `📣 ${text.slice(0, 200)}`, link: link || "/", key: "announcement" }
    );
    res.status(201).json({ announcement: a });
  } catch (err) {
    next(err);
  }
});

router.delete("/announcements/current", ensureAdmin, async (req, res, next) => {
  try {
    const { modifiedCount } = await Announcement.updateMany({ active: true }, { $set: { active: false } });
    if (modifiedCount) await audit(req, "Removed announcement");
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// --- Overview (admins) ------------------------------------------------------

router.get("/admin/overview", ensureAdmin, async (_req, res, next) => {
  try {
    const now = Date.now();
    const week = new Date(now - 7 * DAY);
    const month = new Date(now - 30 * DAY);
    const realEdits = { seeded: { $ne: true }, excludeFromStats: { $ne: true }, authorEmail: { $ne: null } };

    const [
      membersTotal,
      membersActive,
      neverSignedIn,
      signedInWeek,
      pages,
      hiddenPages,
      editsWeek,
      editsMonth,
      commentsWeek,
      commentsTotal,
      bookmarksTotal,
      neverList,
      topCommented,
      topSaved,
      recentAudit,
    ] = await Promise.all([
      Member.countDocuments(),
      Member.countDocuments({ active: true }),
      Member.countDocuments({ active: true, lastActiveAt: null }),
      Member.countDocuments({ lastActiveAt: { $gte: week } }),
      Page.countDocuments({ hidden: false }),
      Page.countDocuments({ hidden: true }),
      Revision.countDocuments({ ...realEdits, createdAt: { $gte: week } }),
      Revision.countDocuments({ ...realEdits, createdAt: { $gte: month } }),
      Comment.countDocuments({ deleted: false, createdAt: { $gte: week } }),
      Comment.countDocuments({ deleted: false }),
      Bookmark.countDocuments(),
      Member.find({ active: true, lastActiveAt: null }).sort({ createdAt: 1 }).select("name collegeEmail createdAt").limit(500).lean(),
      Comment.aggregate([
        { $match: { deleted: false } },
        { $group: { _id: "$slug", count: { $sum: 1 }, last: { $max: "$createdAt" } } },
        { $sort: { count: -1, last: -1 } },
        { $limit: 5 },
      ]),
      Bookmark.aggregate([{ $group: { _id: "$slug", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]),
      AuditLog.find().sort({ createdAt: -1 }).limit(15).lean(),
    ]);

    const slugs = [...new Set([...topCommented, ...topSaved].map((r) => r._id))];
    const titles = new Map((await Page.find({ slug: { $in: slugs } }).select("slug title").lean()).map((p) => [p.slug, p.title]));
    const withTitle = (rows) => rows.filter((r) => titles.has(r._id)).map((r) => ({ slug: r._id, title: titles.get(r._id), count: r.count }));

    res.json({
      members: { total: membersTotal, active: membersActive, neverSignedIn, signedInWeek },
      content: { pages, hiddenPages, editsWeek, editsMonth, commentsWeek, commentsTotal, bookmarksTotal },
      neverSignedIn: neverList.map((m) => ({ name: m.name, email: m.collegeEmail, addedAt: m.createdAt })),
      topCommented: withTitle(topCommented),
      topSaved: withTitle(topSaved),
      recentAudit,
    });
  } catch (err) {
    next(err);
  }
});

// The full audit trail, newest first, paged by "before" timestamp.
router.get("/admin/audit", ensureAdmin, async (req, res, next) => {
  try {
    const before = req.query.before ? new Date(String(req.query.before)) : null;
    const filter = before && !Number.isNaN(before.getTime()) ? { createdAt: { $lt: before } } : {};
    const entries = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ entries, more: entries.length === 50 });
  } catch (err) {
    next(err);
  }
});

// Every recent comment across the hub, for moderation.
router.get("/admin/comments", ensureAdmin, async (_req, res, next) => {
  try {
    const comments = await Comment.find({ deleted: false }).sort({ createdAt: -1 }).limit(100).lean();
    const titles = new Map(
      (await Page.find({ slug: { $in: [...new Set(comments.map((c) => c.slug))] } }).select("slug title").lean()).map((p) => [
        p.slug,
        p.title,
      ])
    );
    res.json({
      comments: comments.map((c) => ({
        _id: c._id,
        slug: c.slug,
        pageTitle: titles.get(c.slug) || c.slug,
        authorName: c.authorName,
        authorEmail: c.authorEmail,
        body: c.body,
        isReply: Boolean(c.parentId),
        createdAt: c.createdAt,
        editedAt: c.editedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
