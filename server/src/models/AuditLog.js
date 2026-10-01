const mongoose = require("mongoose");

// A record of every administrative action — role changes, deactivations,
// removals, page deletions, reverts, moderation. Page *edits* aren't here;
// they already live in Revision with full history.
const auditLogSchema = new mongoose.Schema(
  {
    actorEmail: { type: String, required: true },
    actorName: { type: String, default: "" },
    action: { type: String, required: true },
    // What was acted on, as a human-readable label (a name, a page title).
    target: { type: String, default: "" },
    details: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
