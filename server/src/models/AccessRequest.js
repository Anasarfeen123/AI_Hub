const mongoose = require("mongoose");

// Someone asking to join from the public landing page; a lead or admin
// approves (which adds them to the member list) or declines.
const accessRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    note: { type: String, default: "", maxlength: 500 },
    status: { type: String, enum: ["pending", "approved", "declined"], default: "pending" },
    reviewedBy: { type: String, default: "" },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

accessRequestSchema.index({ status: 1, createdAt: -1 });
accessRequestSchema.index({ email: 1, status: 1 });

module.exports = mongoose.model("AccessRequest", accessRequestSchema);
