import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Header from "../components/Header";
import TopNav from "../components/TopNav";
import { useAuth } from "../context/AuthContext";
import { fetchChanges, fetchDiff, revertRevision } from "../api";
import DiffView from "../components/DiffView";
import AdminNav from "../components/AdminNav";
import { isStaff } from "../lib/roles";
import { useNav } from "../context/NavContext";
import { findInNav } from "../lib/nav";
import { relativeTime } from "../lib/format";
import useDocumentTitle from "../hooks/useDocumentTitle";

// "+120 / −8 words" — how big the change was, at a glance.
function sizeOf(rev) {
  const parts = [];
  if (rev.wordsAdded) parts.push(`+${rev.wordsAdded}`);
  if (rev.wordsRemoved) parts.push(`−${rev.wordsRemoved}`);
  return parts.length ? `${parts.join(" / ")} words` : null;
}

// Shared by /admin (everything) and /my-edits (just yours). Reverting is only
// offered to admins; everyone else gets a read-only history.
export default function ChangesPage({ mine = false }) {
  const { user, loading: authLoading } = useAuth();
  const [changes, setChanges] = useState(null);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [diff, setDiff] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const isAdmin = isStaff(user?.role);
  const { nav } = useNav();
  useDocumentTitle(mine ? "Your edits" : "Recent changes");

  async function load() {
    setError(null);
    try {
      setChanges(await fetchChanges(mine));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, mine]);

  if (authLoading) return <div className="hub-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  async function toggleDiff(id) {
    if (openId === id) {
      setOpenId(null);
      setDiff(null);
      return;
    }
    setOpenId(id);
    setDiff(null);
    try {
      setDiff(await fetchDiff(id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRevert(id) {
    if (!window.confirm("Restore this version? It publishes immediately.")) return;
    setBusyId(id);
    setError(null);
    try {
      await revertRevision(id);
      await load();
      setOpenId(null);
      setDiff(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <Header />
      <TopNav />
      <div id="main" className="editor-wrap">
        <h1>{mine ? "Your edits" : "Recent changes"}</h1>
        {!mine && isAdmin && <AdminNav />}
        <p className="editor-note">
          {mine
            ? "Everything you've published, newest first."
            : "Every change across the hub, newest first. Open one to see what changed, and restore an earlier version if you need to."}
        </p>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        {!changes && !error && <p className="md-status">Loading…</p>}

        {changes && changes.length === 0 && (
          <div className="empty-state empty-state--boxed">
            <p>
              <strong>{mine ? "You haven't edited anything yet." : "No changes recorded yet."}</strong>
            </p>
            {mine && (
              <>
                <p className="md-status">
                  Spotted a gap or a better resource? Open any page and hit Edit — it goes live straight
                  away, and it counts towards the contributors board.
                </p>
                <Link className="btn" to="/roadmap">
                  Find a page to improve
                </Link>
              </>
            )}
          </div>
        )}

        {changes &&
          changes.map((rev) => (
            <div className="review-card" key={rev._id}>
              <div className="review-head">
                <div className="review-who">
                  <Link to={`/${rev.slug}`} className="review-title">
                    {findInNav(nav, rev.slug)?.page?.title || rev.slug}
                  </Link>
                  <p className="review-meta">
                    {rev.seeded ? "Initial import" : rev.authorName || rev.authorEmail || "—"} ·{" "}
                    <time dateTime={rev.createdAt} title={new Date(rev.createdAt).toLocaleString()}>
                      {relativeTime(rev.createdAt)}
                    </time>
                    {sizeOf(rev) && (
                      <>
                        {" · "}
                        <span className="review-size">{sizeOf(rev)}</span>
                      </>
                    )}
                    <span className="review-slug-path">/{rev.slug}</span>
                  </p>
                </div>
                <div className="review-head-actions">
                  <button type="button" className="btn btn--sm" onClick={() => toggleDiff(rev._id)}>
                    {openId === rev._id ? "Hide changes" : "View changes"}
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      className="btn btn--sm"
                      disabled={busyId === rev._id}
                      onClick={() => handleRevert(rev._id)}
                    >
                      Restore this
                    </button>
                  )}
                </div>
              </div>

              {rev.note && !rev.seeded && <p className="review-summary">“{rev.note}”</p>}

              {openId === rev._id && (
                <>
                  {!diff && <p className="md-status">Loading changes…</p>}
                  {diff && <DiffView before={diff.before} after={diff.after} />}
                </>
              )}
            </div>
          ))}
      </div>
    </>
  );
}
