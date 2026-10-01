import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isStaff } from "../lib/roles";
import { initials } from "../lib/format";
import RoleBadge from "./RoleBadge";

// Everything personal and every admin tool lives behind one avatar button, so
// the header has room for search and stays on one line on a phone.
export default function UserMenu() {
  const { user, logout } = useAuth();
  const root = useRef(null);
  const { pathname } = useLocation();
  // Remembering which page the menu was opened on closes it after navigating
  // without an effect: on any other page it simply reads as closed.
  const [openOn, setOpenOn] = useState(null);
  const open = openOn === pathname;
  const setOpen = (value) => setOpenOn((prev) => ((typeof value === "function" ? value(prev === pathname) : value) ? pathname : null));

  // Close on Escape and on a click anywhere else.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => root.current && !root.current.contains(e.target) && setOpen(false);
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        root.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!user) return null;
  const staff = isStaff(user.role);

  return (
    <div className="usermenu" ref={root}>
      <button
        type="button"
        className="usermenu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        title={user.name}
      >
        <span className="usermenu-avatar" aria-hidden="true">
          {initials(user.name)}
        </span>
        <span className="usermenu-name">{user.name.split(" ")[0]}</span>
        <svg className="usermenu-caret" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
        <span className="sr-only">Account menu</span>
      </button>

      {open && (
        // Closes on the click itself, not once the next page has loaded.
        <div className="usermenu-panel" role="menu" onClick={(e) => e.target.closest("a") && setOpen(false)}>
          <div className="usermenu-who">
            <span className="usermenu-avatar usermenu-avatar--lg" aria-hidden="true">
              {initials(user.name)}
            </span>
            <span className="usermenu-who-text">
              <strong>
                {user.name} <RoleBadge role={user.role} />
              </strong>
              <span>{user.email}</span>
            </span>
          </div>

          <div className="usermenu-group">
            <Link role="menuitem" to="/saved">
              Saved pages
            </Link>
            <Link role="menuitem" to="/my-edits">
              My edits
            </Link>
            <Link role="menuitem" to="/contributors">
              Contributors
            </Link>
          </div>

          {staff && (
            <div className="usermenu-group">
              <p className="usermenu-label">Admin</p>
              <Link role="menuitem" to="/admin/overview">
                Overview
              </Link>
              <Link role="menuitem" to="/admin">
                Recent changes
              </Link>
              <Link role="menuitem" to="/admin/pages">
                Pages
              </Link>
              <Link role="menuitem" to="/admin/members">
                Members
              </Link>
              <Link role="menuitem" to="/admin/comments">
                Comments
              </Link>
            </div>
          )}

          <div className="usermenu-group">
            <button type="button" role="menuitem" className="usermenu-signout" onClick={logout}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
