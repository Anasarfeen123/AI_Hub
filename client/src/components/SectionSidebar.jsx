import { NavLink } from "react-router-dom";

export default function SectionSidebar({ section }) {
  if (!section || !section.children || section.children.length === 0) return null;

  return (
    <aside className="section-sidebar">
      <p className="section-sidebar-title">{section.title}</p>
      <NavLink to={`/${section.path}`} end className={({ isActive }) => (isActive ? "active" : "")}>
        Overview
      </NavLink>
      {section.children.map((child) => (
        <NavLink key={child.path} to={`/${child.path}`} className={({ isActive }) => (isActive ? "active" : "")}>
          {child.title}
        </NavLink>
      ))}
    </aside>
  );
}
