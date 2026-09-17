const mongoose = require("mongoose");

// Three ranks, in ascending order of power. Comparing RANK[a] > RANK[b] is the
// single rule behind every permission check, so a new tier only has to be added
// here rather than in each route.
//
//   member     — read the hub, edit any page
//   admin      — the above, plus manage pages and members (sub-leads, volunteers)
//   superadmin — the above, plus manage admins (leads and board members)
//
// A superadmin is deliberately untouchable by an admin: the point of the tier is
// that the people running the club cannot be locked out by someone they
// delegated to.
const ROLES = ["member", "admin", "superadmin"];
const RANK = { member: 0, admin: 1, superadmin: 2 };

// The allowlist: only Google accounts whose verified email matches an active
// member here are let past the login gate. This is the sole access check.
const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    collegeEmail: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    active: { type: Boolean, default: true },
    role: { type: String, enum: ROLES, default: "member" },
    // Optional, purely informational — which vertical the member belongs to.
    department: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

function rankOf(role) {
  return RANK[role] ?? 0;
}

// True if `actor` outranks `target`. Equal ranks return false, which is what
// stops one admin from demoting another.
function outranks(actorRole, targetRole) {
  return rankOf(actorRole) > rankOf(targetRole);
}

const Member = mongoose.model("Member", memberSchema);

module.exports = Member;
module.exports.ROLES = ROLES;
module.exports.RANK = RANK;
module.exports.rankOf = rankOf;
module.exports.outranks = outranks;
