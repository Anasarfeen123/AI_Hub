const mongoose = require("mongoose");

// A page a member has saved for later. Keyed by email rather than member id,
// matching how authorship is recorded on revisions.
const bookmarkSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    slug: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// One bookmark per member per page, and the member's list is read newest first.
bookmarkSchema.index({ email: 1, slug: 1 }, { unique: true });
bookmarkSchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model("Bookmark", bookmarkSchema);
