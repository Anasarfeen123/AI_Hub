import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useNav } from "../context/NavContext";

// The nav grows as admins add sections, so it can't assume everything fits.
// It scrolls horizontally, with arrows and fade edges to make the hidden
// items discoverable — an auto-scrolling marquee was considered and rejected,
// since it makes every link a moving target.
export default function TopNav() {
  const { nav } = useNav();
  const location = useLocation();
  const scroller = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft < max - 4 });
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [measure, nav]);

  // Keep the current section visible — otherwise landing on a page whose tab
  // is scrolled off looks like it isn't in the nav at all.
  useEffect(() => {
    const el = scroller.current;
    const active = el?.querySelector("a.active");
    if (active) active.scrollIntoView({ block: "nearest", inline: "center" });
  }, [location.pathname, nav]);

  // `behavior` is deliberately omitted so the CSS scroll-behavior applies —
  // browsers downgrade that to an instant jump for anyone who has asked for
  // reduced motion, which hardcoding "smooth" here would override.
  const scrollBy = (dir) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * Math.max(200, el.clientWidth * 0.6) });
  };

  return (
    <nav className={`hub-topnav${edges.left ? " is-left" : ""}${edges.right ? " is-right" : ""}`}>
      <div className="hub-topnav-wrap">
        <button
          type="button"
          className="hub-topnav-arrow hub-topnav-arrow--left"
          onClick={() => scrollBy(-1)}
          tabIndex={-1}
          aria-hidden="true"
        >
          ‹
        </button>

        <div className="hub-topnav-inner" ref={scroller}>
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Home
          </NavLink>
          {nav.map((item) => (
            <NavLink
              key={item.path}
              to={`/${item.path}`}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {item.title}
            </NavLink>
          ))}
        </div>

        <button
          type="button"
          className="hub-topnav-arrow hub-topnav-arrow--right"
          onClick={() => scrollBy(1)}
          tabIndex={-1}
          aria-hidden="true"
        >
          ›
        </button>
      </div>
    </nav>
  );
}
