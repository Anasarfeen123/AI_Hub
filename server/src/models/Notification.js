const mongoose = require("mongoose");

// One item in a member's notification bell.
const notificationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true },
    type: { type: String, required: true }, // reply | page-updated | announcement | suggestion | access | flag
    text: { type: String, required: true, maxlength: 300 },
    link: { type: String, default: "" },
    // Collapses repeats: a second unread notification with the same key
    // updates the first instead of piling up.
    key: { type: String, default: "" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ email: 1, createdAt: -1 });
notificationSchema.index({ email: 1, read: 1, key: 1 });
// Old notifications are cleaned up automatically after 90 days.
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model("Notification", notificationSchema);
