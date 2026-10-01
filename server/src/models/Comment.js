const mongoose = require("mongoose");

// One message in a page's discussion thread. Threads are flat with a single
// level of replies: deep nesting reads badly on a phone and a wiki talk page
// rarely needs it.
const commentSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, trim: true },
    // Set on a reply; always points at a top-level comment.
    parentId: { type: mongoose.Schema.Types.ObjectId, default: null },
    authorEmail: { type: String, required: true, lowercase: true },
    authorName: { type: String, default: "" },
    body: { type: String, required: true, maxlength: 5000 },
    editedAt: { type: Date, default: null },
    // Soft delete, so replies under a removed comment keep their context.
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

commentSchema.index({ slug: 1, createdAt: 1 });

module.exports = mongoose.model("Comment", commentSchema);
