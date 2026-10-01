const mongoose = require("mongoose");

// The last time a member read each page and how far down they got, for
// "continue where you left off".
const readingSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true },
    slug: { type: String, required: true },
    // 0..1 — how far down the page they scrolled.
    scroll: { type: Number, default: 0 },
    readAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

readingSchema.index({ email: 1, slug: 1 }, { unique: true });
readingSchema.index({ email: 1, readAt: -1 });

module.exports = mongoose.model("ReadingHistory", readingSchema);
