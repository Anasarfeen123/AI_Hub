// "superadmin" is the database's word for it. Members see "Lead", which is what
// the role actually is in the club.
const LABELS = {
  superadmin: "Lead",
  admin: "Admin",
};

export default function RoleBadge({ role }) {
  if (!role || role === "member") return null;
  return <span className={`role-badge role-badge--${role}`}>{LABELS[role] || role}</span>;
}
