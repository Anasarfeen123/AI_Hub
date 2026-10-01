const express = require("express");
const Page = require("../models/Page");
const Revision = require("../models/Revision");
const Member = require("../models/Member");
const Bookmark = require("../models/Bookmark");
const Comment = require("../models/Comment");
const { isSlug } = require("../lib/validate");
const { computeStats } = require("../lib/diffStats");
const { ensureMember, ensureAdmin } = require("../middleware/ensureMember");

const router = express.Router();

// Everything below is member-only — the hub's content is not public.
router.use(ensureMember);

// Slugs contain slashes ("foundations/python"), so they travel as a query
// param or in the body rather than as a path segment. That keeps routing
// unambiguous — a path-based wildcard would also swallow suffixes.

// --- Reading -------------------------------------------------------------

router.get("/page", async (req, res, next) => {
  try {
    // Without this a missing ?slug queries for undefined and reports "not
    // found", which sends the caller looking for a page that was never asked for.
    if (!isSlug(req.query.slug)) return res.status(400).json({ error: "A slug is required." });

    const page = await Page.findOne({ slug: req.query.slug });
    if (!page) return res.status(404).json({ error: "Page not found." });

    // The byline shows a person, not an address. The name is looked up rather
    // than stored on the page so it follows a member's current name, and it
    // falls back to the email if they have since left the club.
    let editorName = null;
    let editorRole = null;
    const [editor, saved, commentCount] = await Promise.all([
      page.updatedBy ? Member.findOne({ collegeEmail: page.updatedBy.toLowerCase() }).select("name role") : null,
      Bookmark.exists({ email: req.user.email, slug: page.slug }),
      Comment.countDocuments({ slug: page.slug, deleted: false }),
    ]);
    if (editor) {
      editorName = editor.name;
      editorRole = editor.role;
    }

    res.json({
      page: {
        slug: page.slug,
        title: page.title,
        body: page.body,
        linkBase: page.linkBase,
        updatedAt: page.updatedAt,
        updatedBy: page.updatedBy,
        editorName,
        editorRole,
        saved: Boolean(saved),
        commentCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

// --- Editing -------------------------------------------------------------

// Any member can publish. Every save snapshots a Revision, which is what
// makes an admin revert possible after the fact.
router.post("/edits", async (req, res, next) => {
  try {
    const { slug, body, summary, baseUpdatedAt } = req.body;
    // Without this check a missing slug becomes findOne({}) and the edit lands
    // on whichever page Mongo happens to return first.
    if (!isSlug(slug)) return res.status(400).json({ error: "A page slug is required." });
    if (typeof body !== "string" || !body.trim()) {
      return res.status(400).json({ error: "Page content cannot be empty." });
    }

    const page = await Page.findOne({ slug });
    if (!page) return res.status(404).json({ error: "Page not found." });
    if (body === page.body) {
      return res.status(400).json({ error: "No changes to save." });
    }

    // Two members editing the same page: the second save would silently wipe
    // the first. The editor sends the version it started from, and a mismatch
    // is refused so the member can copy their text and reload.
    if (baseUpdatedAt && new Date(baseUpdatedAt).getTime() !== page.updatedAt.getTime()) {
      const by = page.updatedBy ? await Member.findOne({ collegeEmail: page.updatedBy }).select("name") : null;
      return res.status(409).json({
        error: `${by?.name || "Someone"} saved this page while you were editing. Copy your changes, reload, and apply them again.`,
        conflict: true,
      });
    }

    // Measure against what was live a moment ago, before the page is updated.
    const stats = computeStats(page.body, body);

    page.body = body;
    page.updatedBy = req.user.email;
    await page.save();

    const revision = await Revision.create({
      slug: page.slug,
      body,
      authorEmail: req.user.email,
      authorName: req.user.name,
      publishedBy: req.user.email,
      note: (summary || "").slice(0, 300),
      ...stats,
    });

    res.status(201).json({ revisionId: revision._id, updatedAt: page.updatedAt });
  } catch (err) {
    next(err);
  }
});

// --- History -------------------------------------------------------------

// Any member can read history — it's a wiki, so who changed what is public
// to the club. Only reverting is restricted.
router.get("/revisions", async (req, res, next) => {
  try {
    if (!isSlug(req.query.slug)) return res.status(400).json({ error: "A slug is required." });
    const revisions = await Revision.find({ slug: req.query.slug })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ revisions });
  } catch (err) {
    next(err);
  }
});

// The admin review feed: everything that changed recently, newest first.
router.get("/changes", async (req, res, next) => {
  try {
    const mine = req.query.mine === "1";
    const filter = mine ? { authorEmail: req.user.email } : {};
    const revisions = await Revision.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ revisions });
  } catch (err) {
    next(err);
  }
});

// The body a revision replaced, so a reviewer can see what actually changed.
router.get("/revisions/:id/diff", async (req, res, next) => {
  try {
    const revision = await Revision.findById(req.params.id);
    if (!revision) return res.status(404).json({ error: "Revision not found." });

    const previous = await Revision.findOne({
      slug: revision.slug,
      createdAt: { $lt: revision.createdAt },
    }).sort({ createdAt: -1 });

    res.json({
      before: previous ? previous.body : "",
      after: revision.body,
      revision,
    });
  } catch (err) {
    next(err);
  }
});

// Reverting republishes the old body as a NEW revision rather than deleting
// anything — history stays append-only, so a revert can itself be undone.
router.post("/revisions/:id/revert", ensureAdmin, async (req, res, next) => {
  try {
    const revision = await Revision.findById(req.params.id);
    if (!revision) return res.status(404).json({ error: "Revision not found." });

    const page = await Page.findOne({ slug: revision.slug });
    if (!page) return res.status(404).json({ error: "Page no longer exists." });

    // A revert restores someone else's words, so the stats describe the change
    // but attribution stays with the original author — reverting is not a way
    // to farm the leaderboard.
    const stats = computeStats(page.body, revision.body);

    page.body = revision.body;
    page.updatedBy = req.user.email;
    await page.save();

    await Revision.create({
      slug: revision.slug,
      body: revision.body,
      authorEmail: revision.authorEmail,
      authorName: revision.authorName,
      publishedBy: req.user.email,
      note: `Reverted to the version from ${new Date(revision.createdAt).toISOString().slice(0, 10)}`,
      ...stats,
      // The original author was already credited when they wrote this text;
      // counting the restore again would score the same words twice.
      excludeFromStats: true,
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
