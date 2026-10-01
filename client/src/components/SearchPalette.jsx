import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { searchPages } from "../api";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

// Wraps each search term in <mark> without building HTML strings.
function Highlight({ text, terms }) {
  if (!terms?.length) return text;
  const pattern = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text.split(pattern).map((part, i) =>
    i % 2 === 1 ? <mark key={i}>{part}</mark> : <Fragment key={i}>{part}</Fragment>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

// A command-palette search. The header shows a trigger that looks like a
// search box; opening it gives one full-focus panel that works the same on a
// phone as on a laptop, instead of a dropdown squeezed into the header.
export default function SearchPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [state, setState] = useState({ results: [], terms: [], loading: false, error: null });
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // "/" and Ctrl/⌘+K open it from anywhere — except while typing in a field,
  // where "/" is just a character.
  useEffect(() => {
    function onKey(e) {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    }
    // Anything can open search (e.g. the "not found" page) by dispatching
    // this event, without needing a ref to the palette.
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("aihub:open-search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("aihub:open-search", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Debounced, and each new query aborts the one in flight so a slow early
  // response can't overwrite a newer one.
  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) return undefined;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      setState((s) => ({ ...s, loading: true, error: null }));
      searchPages(query, ctrl.signal)
        .then((data) => {
          setState({ results: data.results, terms: data.terms || [], loading: false, error: null });
          setActive(0);
        })
        .catch((err) => {
          if (err.name !== "AbortError") setState((s) => ({ ...s, loading: false, error: err.message }));
        });
    }, 150);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);

  function close() {
    setOpen(false);
    setQ("");
    setState({ results: [], terms: [], loading: false, error: null });
  }

  function go(result) {
    close();
    navigate(`/${result.slug}`);
  }

  const results = q.trim().length >= 2 ? state.results : [];

  function onKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown" && results.length) {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp" && results.length) {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  }

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <>
      <button type="button" className="search-trigger" onClick={() => setOpen(true)} aria-label="Search the hub">
        <SearchIcon />
        <span className="search-trigger-text">Search the hub…</span>
        <kbd className="search-trigger-kbd">{isMac ? "⌘K" : "Ctrl K"}</kbd>
      </button>

      {open &&
        createPortal(
          <div className="search-overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
            <div className="search-panel" role="dialog" aria-modal="true" aria-label="Search the hub">
              <div className="search-input-row">
                <SearchIcon />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Search pages — try “transformers” or “gradient”"
                  aria-label="Search"
                  role="combobox"
                  aria-expanded={results.length > 0}
                  aria-controls="search-results"
                  aria-activedescendant={results[active] ? `search-result-${active}` : undefined}
                  autoComplete="off"
                  spellCheck="false"
                />
                {state.loading && <span className="search-spinner" aria-label="Searching" />}
                <button type="button" className="search-esc" onClick={close}>
                  Esc
                </button>
              </div>

              <div className="search-body" ref={listRef}>
                {q.trim().length < 2 && (
                  <p className="search-hint">Type at least two letters. Every page title and body is searched.</p>
                )}
                {state.error && <p className="search-hint search-hint--error">{state.error}</p>}
                {q.trim().length >= 2 && !state.loading && !state.error && results.length === 0 && (
                  <p className="search-hint">
                    Nothing matches “{q.trim()}”. Try a shorter or different word.
                  </p>
                )}
                {results.length > 0 && (
                  <ul id="search-results" role="listbox" className="search-results">
                    {results.map((r, i) => (
                      <li
                        key={r.slug}
                        id={`search-result-${i}`}
                        data-index={i}
                        role="option"
                        aria-selected={i === active}
                        className={`search-result${i === active ? " is-active" : ""}`}
                        onMouseMove={() => setActive(i)}
                        onClick={() => go(r)}
                      >
                        <span className="search-result-title">
                          {r.section && <span className="search-result-section">{r.section} ›</span>}
                          <Highlight text={r.title} terms={state.terms} />
                        </span>
                        <span className="search-result-snippet">
                          <Highlight text={r.snippet} terms={state.terms} />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="search-foot" aria-hidden="true">
                <span>
                  <kbd>↑</kbd>
                  <kbd>↓</kbd> to move
                </span>
                <span>
                  <kbd>↵</kbd> to open
                </span>
                <span>
                  <kbd>Esc</kbd> to close
                </span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
