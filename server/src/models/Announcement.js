const mongoose = require("mongoose");

// A notice from the leads shown at the top of every member's home page —
// a meetup, a deadline, a new section. Only one is live at a time; posting a
// new one retires the last.
const announcementSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 280 },
    link: { type: String, default: "", trim: true },
    tone: { type: String, enum: ["info", "success", "warning"], default: "info" },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
    createdBy: { type: String, default: "" },
    createdByName: { type: String, default: "" },
  },
  { timestamps: true }
);

announcementSchema.index({ active: 1, createdAt: -1 });

module.exports = mongoose.model("Announcement", announcementSchema);
