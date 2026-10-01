import { useEffect, useRef, useState } from "react";
import { fetchNote, saveNote } from "../api";

// Private notes on a page, saved as you type. Only you ever see them.
export default function NotesPanel({ slug, onClose }) {
  const [body, setBody] = useState(null);
  const [status, setStatus] = useState("");
  const timer = useRef(null);
  const latest = useRef("");

  useEffect(() => {
    let cancelled = false;
    fetchNote(slug)
      .then((n) => {
        if (cancelled) return;
        setBody(n?.body || "");
        latest.current = n?.body || "";
      })
      .catch(() => !cancelled && setBody(""));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Flush a pending save if the panel closes or the page changes mid-typing.
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
        saveNote(slug, latest.current).catch(() => {});
      }
    },
    [slug]
  );

  function change(text) {
    setBody(text);
    latest.current = text;
    setStatus("Saving…");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      timer.current = null;
      try {
        await saveNote(slug, text);
        setStatus(text.trim() ? "Saved" : "Cleared");
      } catch (err) {
        setStatus(err.message);
      }
    }, 700);
  }

  return (
    <section className="notes-panel" aria-label="My notes on this page">
      <div className="notes-panel-head">
        <strong>My notes</strong>
        <span className="notes-panel-private">🔒 Only you can see these</span>
        <span className="notes-panel-status" aria-live="polite">
          {status}
        </span>
        <button type="button" className="notes-panel-close" onClick={onClose} aria-label="Close notes">
          ×
        </button>
      </div>
      {body === null ? (
        <p className="md-status">Loading…</p>
      ) : (
        <textarea
          value={body}
          onChange={(e) => change(e.target.value)}
          placeholder="Jot down what to revisit, exercises to try, questions to ask…"
          rows={5}
          maxLength={20000}
          autoFocus
        />
      )}
    </section>
  );
}
