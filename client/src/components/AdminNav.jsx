import { NavLink } from "react-router-dom";

const LINKS = [
  ["/admin/overview", "Overview"],
  ["/admin", "Recent changes"],
  ["/admin/pages", "Pages"],
  ["/admin/members", "Members"],
  ["/admin/suggestions", "Suggestions"],
  ["/admin/comments", "Comments"],
  ["/admin/analytics", "Analytics"],
  ["/admin/links", "Links"],
  ["/contributors", "Contributors"],
];

export default function AdminNav() {
  return (
    <nav className="admin-nav" aria-label="Admin">
      {LINKS.map(([to, label]) => (
        <NavLink key={to} to={to} end className={({ isActive }) => (isActive ? "active" : "")}>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
