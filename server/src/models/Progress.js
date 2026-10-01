const mongoose = require("mongoose");

// Which roadmap topics a member has ticked off, keyed by topic id (the page
// slug). Stored server-side so progress follows them across devices.
const progressSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    // topic id -> when it was ticked
    done: { type: Map, of: Date, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Progress", progressSchema);
