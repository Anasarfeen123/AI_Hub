import { useState } from "react";
import { setBookmark } from "../api";

// Optimistic: the icon flips immediately and flips back if the save fails,
// so the button never feels laggy on a slow connection.
export default function BookmarkButton({ slug, initial }) {
  const [saved, setSaved] = useState(Boolean(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function toggle() {
    const next = !saved;
    setSaved(next);
    setBusy(true);
    setError(null);
    try {
      await setBookmark(slug, next);
    } catch (err) {
      setSaved(!next);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`md-action-btn${saved ? " is-on" : ""}`}
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      title={error || (saved ? "Remove from your saved pages" : "Save this page for later")}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z" />
      </svg>
      {saved ? "Saved" : "Save"}
    </button>
  );
}
