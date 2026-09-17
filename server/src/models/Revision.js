const mongoose = require("mongoose");

// One published version of a page. A revision is written every time content
// actually goes live — on the initial seed, on an approved edit, and on a
// revert — so `body` is a full snapshot an admin can restore in one step.
const revisionSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, index: true },
    body: { type: String, required: true },
    // Who wrote the content. On a revert this is the original author, so
    // attribution follows the text rather than the person restoring it.
    authorEmail: { type: String, default: null },
    authorName: { type: String, default: null },
    publishedBy: { type: String, default: null },
    note: { type: String, default: "" },

    // How much this revision changed, measured against the one before it and
    // stored at save time. Computing it here keeps the leaderboard a simple
    // aggregation instead of a diff of every revision on every page load.
    linesAdded: { type: Number, default: 0 },
    linesRemoved: { type: Number, default: 0 },
    wordsAdded: { type: Number, default: 0 },
    wordsRemoved: { type: Number, default: 0 },
    charsAdded: { type: Number, default: 0 },

    // The initial import of the original markdown. Excluded from the
    // leaderboard, since nobody typed it into the site.
    seeded: { type: Boolean, default: false },

    // Set by hand to keep a revision out of the leaderboard while leaving it in
    // the page's history — test edits and setup work, which would otherwise sit
    // above members who wrote real content.
    excludeFromStats: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// The leaderboard groups by author and the changes feed sorts by recency.
revisionSchema.index({ authorEmail: 1, createdAt: -1 });

module.exports = mongoose.model("Revision", revisionSchema);
