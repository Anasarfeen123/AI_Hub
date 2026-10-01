const express = require("express");
const Page = require("../models/Page");
const Bookmark = require("../models/Bookmark");
const { ensureMember } = require("../middleware/ensureMember");
const { isSlug, escapeRegex } = require("../lib/validate");

const router = express.Router();
router.use(ensureMember);

// Strips the markdown syntax a snippet would otherwise show raw.
function plainText(md) {
  return (md || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^(!!!|\?\?\?).*$/gm, " ")
    .replace(/[#>*_`|~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function snippetAround(text, terms, size = 180) {
  const lower = text.toLowerCase();
  let at = -1;
  for (const t of terms) {
    const i = lower.indexOf(t);
    if (i !== -1 && (at === -1 || i < at)) at = i;
  }
  if (at === -1) return text.slice(0, size) + (text.length > size ? "…" : "");
  // Snap both ends to word boundaries so a snippet never opens mid-word.
  let start = Math.max(0, at - 60);
  if (start > 0) {
    const space = text.indexOf(" ", start);
    if (space !== -1 && space < at) start = space + 1;
  }
  let end = Math.min(text.length, start + size);
  if (end < text.length) {
    const space = text.lastIndexOf(" ", end);
    if (space > at) end = space;
  }
  return (start > 0 ? "…" : "") + text.slice(start, end).trim() + (end < text.length ? "…" : "");
}

function countOf(haystack, needle) {
  let n = 0;
  let i = 0;
  while ((i = haystack.indexOf(needle, i)) !== -1) {
    n++;
    i += needle.length;
  }
  return n;
}

// --- Search --------------------------------------------------------------

// Every term must appear somewhere in the title or body. Substring matching
// (rather than Mongo's word-stemmed $text) lets "trans" find Transformers,
// which is how people type into a search-as-you-go box.
router.get("/search", async (req, res, next) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
    const terms = [...new Set(q.toLowerCase().split(/\s+/).filter((t) => t.length >= 2))].slice(0, 6);
    if (terms.length === 0) return res.json({ results: [] });

    const pages = await Page.find({
      hidden: false,
      $and: terms.map((t) => {
        const re = new RegExp(escapeRegex(t), "i");
        return { $or: [{ title: re }, { body: re }] };
      }),
    })
      .select("slug title body section")
      .limit(200)
      .lean();

    const sectionTitles = new Map(
      (await Page.find({ section: "" }).select("slug title").lean()).map((p) => [p.slug, p.title])
    );

    const results = pages
      .map((p) => {
        const title = p.title.toLowerCase();
        const text = plainText(p.body);
        const body = text.toLowerCase();
        let score = 0;
        for (const t of terms) {
          if (title === t) score += 50;
          else if (title.startsWith(t)) score += 25;
          else if (title.includes(t)) score += 15;
          score += Math.min(countOf(body, t), 10);
        }
        return {
          slug: p.slug,
          title: p.title,
          section: p.section ? sectionTitles.get(p.section) || "" : "",
          snippet: snippetAround(text, terms),
          score,
        };
      })
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, 20);

    res.json({ results, terms });
  } catch (err) {
    next(err);
  }
});

// --- Bookmarks -----------------------------------------------------------

router.get("/bookmarks", async (req, res, next) => {
  try {
    const marks = await Bookmark.find({ email: req.user.email }).sort({ createdAt: -1 }).limit(500).lean();
    const pages = await Page.find({ slug: { $in: marks.map((m) => m.slug) }, hidden: false })
      .select("slug title section")
      .lean();
    const bySlug = new Map(pages.map((p) => [p.slug, p]));

    // A bookmark whose page was deleted or hidden is skipped rather than shown
    // as a dead link; it reappears if the page comes back.
    res.json({
      bookmarks: marks
        .filter((m) => bySlug.has(m.slug))
        .map((m) => ({ slug: m.slug, title: bySlug.get(m.slug).title, savedAt: m.createdAt })),
    });
  } catch (err) {
    next(err);
  }
});

router.put("/bookmarks", async (req, res, next) => {
  try {
    const { slug } = req.body;
    if (!isSlug(slug)) return res.status(400).json({ error: "A page slug is required." });
    if (!(await Page.exists({ slug }))) return res.status(404).json({ error: "Page not found." });

    await Bookmark.updateOne(
      { email: req.user.email, slug },
      { $setOnInsert: { email: req.user.email, slug } },
      { upsert: true }
    );
    res.json({ ok: true, saved: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/bookmarks", async (req, res, next) => {
  try {
    const { slug } = req.query;
    if (!isSlug(slug)) return res.status(400).json({ error: "A page slug is required." });
    await Bookmark.deleteOne({ email: req.user.email, slug });
    res.json({ ok: true, saved: false });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
