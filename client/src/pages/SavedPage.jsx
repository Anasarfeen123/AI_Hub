import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import TopNav from "../components/TopNav";
import { fetchBookmarks, setBookmark } from "../api";
import { relativeTime } from "../lib/format";
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function SavedPage() {
  useDocumentTitle("Saved pages");
  const [marks, setMarks] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBookmarks()
      .then(setMarks)
      .catch((err) => setError(err.message));
  }, []);

  async function remove(slug) {
    const before = marks;
    setMarks((m) => m.filter((b) => b.slug !== slug));
    try {
      await setBookmark(slug, false);
    } catch (err) {
      setMarks(before);
      setError(err.message);
    }
  }

  return (
    <>
      <Header />
      <TopNav />
      <main id="main" className="editor-wrap">
        <h1>Saved pages</h1>
        <p className="editor-note">
          Pages you've saved for later. Use the <strong>Save</strong> button at the top of any page to add one.
        </p>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        {!marks && !error && <p className="md-status">Loading…</p>}

        {marks && marks.length === 0 && (
          <div className="empty-state empty-state--boxed">
            <p>
              <strong>Nothing saved yet.</strong>
            </p>
            <p className="md-status">Open any topic and hit Save — it'll show up here and on your home page.</p>
            <Link className="btn btn--ghost" to="/roadmap">
              Browse the roadmap
            </Link>
          </div>
        )}

        {marks && marks.length > 0 && (
          <ul className="saved-list">
            {marks.map((b) => (
              <li key={b.slug} className="saved-item">
                <Link to={`/${b.slug}`} className="saved-item-link">
                  <strong>{b.title}</strong>
                  <span>/{b.slug}</span>
                </Link>
                <span className="saved-item-when" title={new Date(b.savedAt).toLocaleString()}>
                  Saved {relativeTime(b.savedAt)}
                </span>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => remove(b.slug)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
