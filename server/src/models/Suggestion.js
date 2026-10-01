const mongoose = require("mongoose");

// A proposed edit waiting for review, for members who'd rather not publish
// straight to the live page.
const suggestionSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true },
    body: { type: String, required: true },
    // The page version the suggestion was written against, so a reviewer can
    // see whether the page changed underneath it.
    baseUpdatedAt: { type: Date, default: null },
    summary: { type: String, default: "", maxlength: 300 },
    authorEmail: { type: String, required: true },
    authorName: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewedBy: { type: String, default: "" },
    reviewNote: { type: String, default: "", maxlength: 500 },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

suggestionSchema.index({ status: 1, createdAt: -1 });
suggestionSchema.index({ authorEmail: 1, createdAt: -1 });

module.exports = mongoose.model("Suggestion", suggestionSchema);
