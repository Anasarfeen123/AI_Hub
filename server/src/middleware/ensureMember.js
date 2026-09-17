const { rankOf } = require("../models/Member");

// Protects any API route that should only answer for a logged-in, still-active MIC member.
function ensureMember(req, res, next) {
  if (req.user) return next();
  res.status(401).json({ error: "Sign in with your member Google account to continue." });
}

// Builds a gate for a minimum rank, so routes declare the level they need
// rather than testing role strings themselves.
function ensureRank(minRole, label) {
  return function gate(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: "Sign in to continue." });
    }
    if (rankOf(req.user.role) < rankOf(minRole)) {
      return res.status(403).json({ error: `${label} only.` });
    }
    next();
  };
}

// Page and member management. A superadmin outranks an admin, so this passes
// for both.
const ensureAdmin = ensureRank("admin", "Admins");

// Reserved for changes to who holds power: granting or revoking admin.
const ensureSuperAdmin = ensureRank("superadmin", "Leads");

module.exports = { ensureMember, ensureAdmin, ensureSuperAdmin, ensureRank };
