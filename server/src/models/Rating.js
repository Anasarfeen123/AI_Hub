const mongoose = require("mongoose");

// "This helped me" on one resource link on one page.
const ratingSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true },
    url: { type: String, required: true, maxlength: 2000 },
    email: { type: String, required: true, lowercase: true },
  },
  { timestamps: true }
);

ratingSchema.index({ slug: 1, url: 1, email: 1 }, { unique: true });
ratingSchema.index({ slug: 1 });

module.exports = mongoose.model("Rating", ratingSchema);
