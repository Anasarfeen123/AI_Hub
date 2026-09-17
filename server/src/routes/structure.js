const express = require("express");
const Page = require("../models/Page");
const Revision = require("../models/Revision");
const RoadmapStage = require("../models/RoadmapStage");
const { ensureMember, ensureAdmin } = require("../middleware/ensureMember");

const router = express.Router();
router.use(ensureMember);

// A topic added to a stage belongs at the END of that stage's sequence —
// the roadmap is an ordered learning path, so a new topic must not jump
// ahead of the ones a member is meant to do first.
async function nextRoadmapOrder(stage) {
  if (!stage) return 0;
  const last = await Page.findOne({ roadmapStage: stage }).sort({ roadmapOrder: -1 }).select("roadmapOrder");
  return last ? last.roadmapOrder + 1 : 0;
}

// Resolves one markdown link target to the slug it actually lands on, mirroring
// resolveRelativeLink in client/src/lib/content.js. It has to be the same walk:
// comparing filenames instead would miss "../resources/index.md", since an index
// page's link ends in "index.md" rather than in its own slug.
//
// `linkBase` is the directory the page's relative links resolve against; it is
// stored per page because it cannot be inferred from the slug.
function resolveLinkTarget(raw, linkBase) {
  const path = raw.split("#")[0].trim();
  if (!path) return null;
  if (/^(https?:)?\/\//.test(path) || path.startsWith("mailto:")) return null;

  // Already an in-app route.
  if (path.startsWith("/")) return path.replace(/\/+$/, "").slice(1);
  if (!path.endsWith(".md")) return null;

  const segments = linkBase ? linkBase.split("/") : [];
  for (const part of path.split("/")) {
    if (part === "." || part === "") continue;
    if (part === "..") segments.pop();
    else segments.push(part);
  }

  return segments
    .join("/")
    .replace(/\.md$/, "")
    .replace(/(^|\/)index$/, "$1")
    .replace(/\/+$/, "");
}

// True if `body` contains a markdown link that lands on `slug`. Scans for "]("
// rather than building a RegExp: slugs are user-supplied, so a pattern would
// have to quote them, and this also handles trimmed targets and "#anchor".
function linksTo(body, linkBase, slug) {
  const text = body || "";
  let i = 0;

  while ((i = text.indexOf("](", i)) !== -1) {
    const close = text.indexOf(")", i);
    if (close === -1) break;

    if (resolveLinkTarget(text.slice(i + 2, close), linkBase) === slug) return true;

    i = close;
  }

  return false;
}

// --- Reads (every member) -------------------------------------------------

// The nav tree, derived from the pages themselves.
router.get("/nav", async (_req, res, next) => {
  try {
    const pages = await Page.find({ hidden: false })
      .sort({ order: 1, title: 1 })
      .select("slug title section order");

    const top = pages.filter((p) => !p.section);
    const nav = top.map((p) => ({
      title: p.title,
      path: p.slug,
      children: pages
        .filter((c) => c.section === p.slug)
        .map((c) => ({ title: c.title, path: c.slug })),
    }));

    res.json({ nav });
  } catch (err) {
    next(err);
  }
});

// Stages plus the pages that opted into each one.
router.get("/roadmap", async (_req, res, next) => {
  try {
    const [stages, pages] = await Promise.all([
      RoadmapStage.find().sort({ order: 1 }),
      Page.find({ roadmapStage: { $ne: "" }, hidden: false })
        .sort({ roadmapOrder: 1, title: 1 })
        .select("slug title roadmapStage roadmapDesc roadmapOrder"),
    ]);

    res.json({
      stages: stages.map((s) => ({
        id: s.key,
        num: s.num,
        label: s.label,
        levelClass: s.levelClass,
        title: s.title,
        duration: s.duration,
        goal: s.goal,
        nodes: pages
          .filter((p) => p.roadmapStage === s.key)
          .map((p) => ({
            id: p.slug,
            title: p.title,
            desc: p.roadmapDesc,
            href: p.slug,
          })),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// --- Page management (admins only) ---------------------------------------

router.get("/pages", ensureAdmin, async (_req, res, next) => {
  try {
    const pages = await Page.find()
      .sort({ section: 1, order: 1 })
      .select("slug title section order hidden roadmapStage roadmapOrder roadmapDesc updatedAt");
    res.json({ pages });
  } catch (err) {
    next(err);
  }
});

router.post("/pages", ensureAdmin, async (req, res, next) => {
  try {
    const title = (req.body.title || "").trim();
    const section = (req.body.section || "").trim();
    let slug = (req.body.slug || "").trim().toLowerCase();

    if (!title) return res.status(400).json({ error: "A title is required." });

    // Derive a slug from the title when one isn't supplied.
    if (!slug) {
      slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
    }
    // Child pages live under their section's path.
    if (section && !slug.startsWith(`${section}/`)) slug = `${section}/${slug}`;

    if (!/^[a-z0-9/-]+$/.test(slug)) {
      return res.status(400).json({ error: "Slug may only contain lowercase letters, numbers, hyphens and slashes." });
    }
    if (await Page.findOne({ slug })) {
      return res.status(409).json({ error: `A page already exists at "${slug}".` });
    }
    if (section && !(await Page.findOne({ slug: section }))) {
      return res.status(400).json({ error: `No section exists at "${section}".` });
    }

    // Put it last within its section unless told otherwise.
    const siblings = await Page.countDocuments({ section });
    const body = typeof req.body.body === "string" ? req.body.body : `Write the ${title} page here.\n`;

    const stage = (req.body.roadmapStage || "").trim();
    const page = await Page.create({
      slug,
      title,
      body,
      section,
      order: typeof req.body.order === "number" ? req.body.order : siblings,
      // Relative .md links resolve against the page's own folder.
      linkBase: slug.includes("/") ? slug.slice(0, slug.lastIndexOf("/")) : "",
      roadmapStage: stage,
      roadmapOrder:
        typeof req.body.roadmapOrder === "number" ? req.body.roadmapOrder : await nextRoadmapOrder(stage),
      roadmapDesc: (req.body.roadmapDesc || "").trim(),
      updatedBy: req.user.email,
    });

    await Revision.create({
      slug: page.slug,
      body: page.body,
      authorEmail: req.user.email,
      authorName: req.user.name,
      publishedBy: req.user.email,
      note: "Page created",
    });

    res.status(201).json({ page });
  } catch (err) {
    next(err);
  }
});

// Metadata only — page *text* is edited through /api/edits so that every
// content change lands in the revision history.
router.patch("/pages/:id", ensureAdmin, async (req, res, next) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ error: "Page not found." });

    const movedStage =
      typeof req.body.roadmapStage === "string" && req.body.roadmapStage.trim() !== page.roadmapStage;

    const fields = ["title", "section", "roadmapStage", "roadmapDesc"];
    for (const f of fields) {
      if (typeof req.body[f] === "string") page[f] = req.body[f].trim();
    }

    // Re-slot at the end of the new stage, otherwise it inherits an order
    // from its old stage and lands in an arbitrary position.
    if (movedStage && typeof req.body.roadmapOrder !== "number") {
      page.roadmapOrder = await nextRoadmapOrder(page.roadmapStage);
    }
    for (const f of ["order", "roadmapOrder"]) {
      if (typeof req.body[f] === "number") page[f] = req.body[f];
    }
    if (typeof req.body.hidden === "boolean") page.hidden = req.body.hidden;

    await page.save();
    res.json({ page });
  } catch (err) {
    next(err);
  }
});

router.delete("/pages/:id", ensureAdmin, async (req, res, next) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ error: "Page not found." });

    const children = await Page.countDocuments({ section: page.slug });
    if (children > 0) {
      return res.status(409).json({
        error: `"${page.title}" still has ${children} page(s) inside it. Move or delete those first.`,
      });
    }

    // Deleting a page silently breaks every link pointing at it, and those
    // links are invisible until a member clicks one. Surface them instead,
    // and require an explicit confirmation to go ahead.
    const linkers = (
      await Page.find({ slug: { $ne: page.slug } }).select("slug title body linkBase")
    ).filter((other) => linksTo(other.body, other.linkBase, page.slug));

    if (linkers.length > 0 && req.query.force !== "1") {
      return res.status(409).json({
        error: `${linkers.length} page(s) link to "${page.title}" and those links will break: ${linkers
          .map((l) => l.title)
          .join(", ")}. Delete anyway?`,
        linkedFrom: linkers.map((l) => ({ slug: l.slug, title: l.title })),
        needsForce: true,
      });
    }

    await page.deleteOne();
    // Revisions are deliberately kept, so a deleted page can still be recovered
    // from its history if it turns out to have been a mistake.
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// --- Roadmap stages (admins only) ----------------------------------------

router.get("/roadmap/stages", ensureAdmin, async (_req, res, next) => {
  try {
    res.json({ stages: await RoadmapStage.find().sort({ order: 1 }) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
