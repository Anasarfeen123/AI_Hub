import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const mod = isMac ? "⌘" : "Ctrl";

const GROUPS = [
  {
    title: "Anywhere",
    keys: [
      [["/"], "Search the hub"],
      [[mod, "K"], "Search the hub"],
      [["n"], "Open notifications"],
      [["?"], "Show this list"],
      [["Esc"], "Close a menu or dialog"],
    ],
  },
  {
    title: "Go to",
    keys: [
      [["g", "h"], "Home"],
      [["g", "r"], "Roadmap"],
      [["g", "s"], "Saved pages"],
      [["g", "n"], "My notes"],
      [["g", "p"], "Your profile"],
    ],
  },
  {
    title: "On a page",
    keys: [
      [["e"], "Edit this page"],
      [["b"], "Save / unsave this page"],
    ],
  },
  {
    title: "In the editor",
    keys: [
      [[mod, "S"], "Save or send for review"],
      [[mod, "Enter"], "Post a comment"],
    ],
  },
];

const GO = { h: "/", r: "/roadmap", s: "/saved", n: "/notes", p: "/me" };

// Site-wide keys. They're ignored while typing in a field, so they never get
// in the way of writing.
export default function KeyboardShortcuts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const pendingG = useRef(0);

  useEffect(() => {
    if (!user) return undefined;
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
      if (document.querySelector("[role=dialog][aria-modal=true]") && e.key !== "Escape") return;

      const k = e.key;
      if (k === "?") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (k === "Escape") {
        setOpen(false);
        return;
      }
      if (Date.now() - pendingG.current < 1200 && GO[k]) {
        e.preventDefault();
        pendingG.current = 0;
        navigate(GO[k]);
        return;
      }
      if (k === "g") {
        pendingG.current = Date.now();
        return;
      }
      if (k === "n") {
        e.preventDefault();
        window.dispatchEvent(new Event("aihub:open-notifications"));
        return;
      }
      // Page actions only exist on a content page, which marks itself.
      const pageEl = document.querySelector("[data-page-slug]");
      if (k === "e" && pageEl) {
        e.preventDefault();
        navigate(`/edit/${pageEl.getAttribute("data-page-slug")}`);
      } else if (k === "b" && pageEl) {
        e.preventDefault();
        document.querySelector("[data-shortcut=bookmark]")?.click();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [user, navigate]);

  if (!open) return null;
  return createPortal(
    <div className="search-overlay" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="shortcuts" role="dialog" aria-modal="true" aria-labelledby="shortcuts-title">
        <div className="shortcuts-head">
          <h2 id="shortcuts-title">Keyboard shortcuts</h2>
          <button type="button" className="search-esc" onClick={() => setOpen(false)}>
            Esc
          </button>
        </div>
        <div className="shortcuts-grid">
          {GROUPS.map((g) => (
            <section key={g.title}>
              <h3>{g.title}</h3>
              <dl>
                {g.keys.map(([keys, what]) => (
                  <div key={what + keys.join()}>
                    <dt>
                      {keys.map((key, i) => (
                        <span key={key}>
                          {i > 0 && <span className="shortcuts-then">{keys[0] === "g" ? "then" : "+"}</span>}
                          <kbd>{key}</kbd>
                        </span>
                      ))}
                    </dt>
                    <dd>{what}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
