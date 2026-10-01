const mongoose = require("mongoose");

// A member's private notes on one page. Only ever shown to its author.
const noteSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true },
    slug: { type: String, required: true },
    body: { type: String, default: "", maxlength: 20000 },
  },
  { timestamps: true }
);

noteSchema.index({ email: 1, slug: 1 }, { unique: true });
noteSchema.index({ email: 1, updatedAt: -1 });

module.exports = mongoose.model("Note", noteSchema);
