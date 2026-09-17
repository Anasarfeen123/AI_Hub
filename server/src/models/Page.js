const mongoose = require("mongoose");

// The live content of one hub page. Seeded from the original markdown files
// (see scripts/seedPages.js), then edited in-app from there on.
//
// `body` is raw markdown exactly as an editor types it — the client applies
// the same preprocessing (relative .md links, admonitions) it always has.
const pageSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: "" },
    // Directory the page's relative `.md` links resolve against. Can't be
    // derived from the slug: "foundations" (foundations/index.md) resolves
    // against "foundations", while "roadmap" (roadmap.md) resolves against "".
    linkBase: { type: String, default: "" },
    updatedBy: { type: String, default: null },

    // --- Navigation ---
    // The nav tree is derived from these rather than stored separately, so a
    // page and its nav entry can never drift apart. Top-level pages have an
    // empty section; a child's section is its parent's slug.
    section: { type: String, default: "" },
    order: { type: Number, default: 0 },
    hidden: { type: Boolean, default: false },

    // --- Roadmap placement (opt-in) ---
    // Empty stage means the page simply isn't part of the learning path —
    // Contributing and Careers shouldn't appear on the roadmap.
    roadmapStage: { type: String, default: "" },
    roadmapOrder: { type: Number, default: 0 },
    roadmapDesc: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Page", pageSchema);
