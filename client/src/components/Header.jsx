import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import RoleBadge from "./RoleBadge";
import micLogo from "../assets/mic-logo.png";
import { isStaff } from "../lib/roles";

export default function Header() {
  const { user, logout } = useAuth();
  const isAdmin = isStaff(user?.role);

  return (
    <header className="hub-header">
      <div className="hub-header-inner">
        <Link className="hub-brand" to="/" aria-label="AI/ML Resource Hub — home">
          <img src={micLogo} alt="" />
          <span>AI/ML Resource Hub</span>
        </Link>
        {user && (
          <div className="hub-header-user">
            {isAdmin && (
              <>
                <Link className="hub-header-link" to="/admin/pages">
                  Pages
                </Link>
                <Link className="hub-header-link" to="/admin">
                  Changes
                </Link>
              </>
            )}
            <Link className="hub-header-link" to="/contributors">
              Contributors
            </Link>
            <Link className="hub-header-link" to="/my-edits">
              My edits
            </Link>
            <span className="hub-header-name">
              {/* The name truncates on its own; text-overflow can't ellipsis a
                  container that also holds the badge. */}
              <span className="hub-header-name-text">{user.name}</span>
              <RoleBadge role={user.role} />
            </span>
            <ThemeToggle />
            <button className="hub-header-signout" onClick={logout}>
              Sign out
            </button>
          </div>
        )}
        {!user && <ThemeToggle />}
      </div>
    </header>
  );
}
