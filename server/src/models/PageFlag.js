const mongoose = require("mongoose");

// "This page needs help" — raised by any member, resolved by an editor.
const pageFlagSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true },
    kind: { type: String, enum: ["outdated", "incomplete", "broken-link", "unclear", "other"], required: true },
    note: { type: String, default: "", maxlength: 500 },
    createdBy: { type: String, required: true },
    createdByName: { type: String, default: "" },
    resolved: { type: Boolean, default: false },
    resolvedBy: { type: String, default: "" },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

pageFlagSchema.index({ resolved: 1, createdAt: -1 });
pageFlagSchema.index({ slug: 1, resolved: 1 });

module.exports = mongoose.model("PageFlag", pageFlagSchema);
