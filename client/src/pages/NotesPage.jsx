import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import TopNav from "../components/TopNav";
import { fetchNotes } from "../api";
import { relativeTime } from "../lib/format";
import useDocumentTitle from "../hooks/useDocumentTitle";

// Every private note in one place.
export default function NotesPage() {
  useDocumentTitle("My notes");
  const [notes, setNotes] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetchNotes()
      .then(setNotes)
      .catch((err) => setError(err.message));
  }, []);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!notes || !t) return notes || [];
    return notes.filter((n) => n.body.toLowerCase().includes(t) || n.title.toLowerCase().includes(t));
  }, [notes, q]);

  return (
    <>
      <Header />
      <TopNav />
      <main id="main" className="editor-wrap">
        <h1>My notes</h1>
        <p className="editor-note">
          🔒 Private to you. Add a note from the <strong>Notes</strong> button at the top of any page.
        </p>
        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        {!notes && !error && <p className="md-status">Loading…</p>}
        {notes?.length === 0 && (
          <div className="empty-state empty-state--boxed">
            <p>
              <strong>No notes yet.</strong>
            </p>
            <p className="md-status">Open a topic, hit Notes, and jot down what to revisit or try.</p>
            <Link className="btn" to="/roadmap">
              Browse the roadmap
            </Link>
          </div>
        )}
        {notes?.length > 0 && (
          <>
            <input className="member-search" type="search" placeholder={`Search ${notes.length} notes…`} value={q} onChange={(e) => setQ(e.target.value)} />
            <ul className="notes-list">
              {shown.map((n) => (
                <li key={n.slug}>
                  <div className="notes-list-head">
                    <Link to={`/${n.slug}`}>{n.title}</Link>
                    <time dateTime={n.updatedAt}>{relativeTime(n.updatedAt)}</time>
                  </div>
                  <p>{n.body.length > 400 ? `${n.body.slice(0, 400)}…` : n.body}</p>
                </li>
              ))}
            </ul>
            {shown.length === 0 && <p className="md-status">No notes match “{q}”.</p>}
          </>
        )}
      </main>
    </>
  );
}
