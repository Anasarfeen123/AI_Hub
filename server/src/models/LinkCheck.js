const mongoose = require("mongoose");

// The result of checking one external link found in page content.
const linkCheckSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
  // ok | broken | unknown (the site refused to answer a bot, or timed out)
  state: { type: String, enum: ["ok", "broken", "unknown"], required: true },
  status: { type: Number, default: 0 },
  error: { type: String, default: "" },
  pages: { type: [String], default: [] },
  checkedAt: { type: Date, default: Date.now },
});

linkCheckSchema.index({ state: 1 });

module.exports = mongoose.model("LinkCheck", linkCheckSchema);
