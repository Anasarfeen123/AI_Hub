import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StaffPage from "../components/StaffPage";
import { fetchAllComments, deleteComment } from "../api";
import { relativeTime } from "../lib/format";

// Every recent comment across the hub in one feed, so moderation doesn't mean
// opening thirty pages.
export default function CommentsAdminPage() {
  const [comments, setComments] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    fetchAllComments()
      .then(setComments)
      .catch((err) => setError(err.message));
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!comments || !q) return comments || [];
    return comments.filter((c) =>
      [c.body, c.authorName, c.authorEmail, c.pageTitle].some((v) => (v || "").toLowerCase().includes(q))
    );
  }, [comments, query]);

  async function remove(c) {
    if (!window.confirm(`Delete this comment by ${c.authorName || c.authorEmail}? It's recorded in the admin log.`)) return;
    setBusyId(c._id);
    setError(null);
    try {
      await deleteComment(c._id);
      setComments((list) => list.filter((x) => x._id !== c._id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <StaffPage
      title="Comments"
      intro="The latest 100 comments across every page, newest first. Removing one leaves a 'deleted' placeholder so replies keep their context."
    >
      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}
      {!comments && !error && <p className="md-status">Loading…</p>}

      {comments && (
        <>
          <input
            className="member-search"
            type="search"
            placeholder={`Search ${comments.length} comments by text, author or page…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {comments.length === 0 && (
            <div className="empty-state empty-state--boxed">
              <p>
                <strong>No comments yet.</strong>
              </p>
              <p className="md-status">They'll show up here as members start discussing pages.</p>
            </div>
          )}
          {comments.length > 0 && shown.length === 0 && <p className="md-status">No comments match “{query}”.</p>}
          <ul className="mod-list">
            {shown.map((c) => (
              <li key={c._id} className="mod-item">
                <div className="mod-meta">
                  <strong>{c.authorName || c.authorEmail}</strong>
                  <span>{c.isReply ? "replied on" : "commented on"}</span>
                  <Link to={`/${c.slug}#discussion`}>{c.pageTitle}</Link>
                  <time dateTime={c.createdAt} title={new Date(c.createdAt).toLocaleString()}>
                    {relativeTime(c.createdAt)}
                  </time>
                  {c.editedAt && <span className="mod-edited">(edited)</span>}
                </div>
                <p className="mod-body">{c.body}</p>
                <button type="button" className="btn btn--sm mod-delete" onClick={() => remove(c)} disabled={busyId === c._id}>
                  {busyId === c._id ? "Deleting…" : "Delete"}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </StaffPage>
  );
}
