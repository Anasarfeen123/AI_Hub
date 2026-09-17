// Mirrors the server's ranking in server/src/models/Member.js. Kept in one
// place so a role check can never mean "admin exactly" by accident — that
// would lock a lead out of the tools they're meant to outrank.
export const RANK = { member: 0, admin: 1, superadmin: 2 };

export function rankOf(role) {
  return RANK[role] ?? 0;
}

// Can this role reach the admin tools (pages, members, changes)?
export function isStaff(role) {
  return rankOf(role) >= RANK.admin;
}

// Can this role change who holds power?
export function isLead(role) {
  return rankOf(role) >= RANK.superadmin;
}

// True if `actor` may act on `target`. Equal ranks are false, which is what
// stops one admin from demoting another.
export function outranks(actorRole, targetRole) {
  return rankOf(actorRole) > rankOf(targetRole);
}
