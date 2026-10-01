const AuditLog = require("../models/AuditLog");

// Best-effort: an audit write failing must never fail the action it records,
// so errors are logged rather than thrown.
async function audit(req, action, target = "", details = "") {
  try {
    await AuditLog.create({
      actorEmail: req.user.email,
      actorName: req.user.name,
      action,
      target: String(target).slice(0, 200),
      details: String(details).slice(0, 500),
    });
  } catch (err) {
    console.error("audit log write failed:", err.message);
  }
}

module.exports = { audit };
