const mongoose = require("mongoose");

// Daily view counts per page, for admin analytics. One document per page per
// day; `readers` holds who read it that day, so unique readers can be counted.
const pageViewSchema = new mongoose.Schema({
  slug: { type: String, required: true },
  day: { type: String, required: true }, // YYYY-MM-DD, India time
  views: { type: Number, default: 0 },
  readers: { type: [String], default: [] },
});

pageViewSchema.index({ slug: 1, day: 1 }, { unique: true });
pageViewSchema.index({ day: 1 });

module.exports = mongoose.model("PageView", pageViewSchema);
