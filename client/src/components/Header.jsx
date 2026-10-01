import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import SearchPalette from "./SearchPalette";
import UserMenu from "./UserMenu";
import NotificationBell from "./NotificationBell";
import hubMark from "../assets/hub-mark.png";
import Wordmark from "./Wordmark";

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="hub-header">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="hub-header-inner">
        <Link className="hub-brand" to="/" aria-label="AIML Resource Hub — home">
          <img src={hubMark} alt="" width="40" height="30" />
          <Wordmark />
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
