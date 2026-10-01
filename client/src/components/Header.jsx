import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import SearchPalette from "./SearchPalette";
import UserMenu from "./UserMenu";
import NotificationBell from "./NotificationBell";
import micLogo from "../assets/mic-logo.png";

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="hub-header">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="hub-header-inner">
        <Link className="hub-brand" to="/" aria-label="AI/ML Resource Hub — home">
          <img src={micLogo} alt="" width="42" height="30" />
          <span>
            AI/ML <span className="hub-brand-rest">Resource Hub</span>
          </span>
        </Link>
        {user && <SearchPalette />}
        <div className="hub-header-user">
          <ThemeToggle />
          {user && <NotificationBell />}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
