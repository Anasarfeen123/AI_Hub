import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StaffPage from "../components/StaffPage";
import DiffView from "../components/DiffView";
import { fetchSuggestions, reviewSuggestion } from "../api";
import { relativeTime } from "../lib/format";

const TABS = [
  ["pending", "Waiting"],
  ["approved", "Approved"],
  ["rejected", "Declined"],
];

function Suggestion({ s, onDone }) {
  const [open, setOpen] = useState(s.status === "pending");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function decide(decision) {
    if (decision === "approve" && s.stale && !window.confirm("The page changed after this was written. Approving replaces the current text with the suggestion — check the diff first. Continue?")) return;
    setBusy(true);
    setError(null);
    try {
      await reviewSuggestion(s._id, decision, note);
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <li className="sugg">
      <div className="sugg-head">
        <div>
          <Link to={`/${s.slug}`} className="review-title">
            {s.title}
          </Link>
          <p className="review-meta">
            {s.authorName || s.authorEmail} · {relativeTime(s.createdAt)}
            {s.summary && <> · “{s.summary}”</>}
          </p>
        </div>
        <button type="button" className="btn btn--sm" onClick={() => setOpen((o) => !o)}>
          {open ? "Hide changes" : "View changes"}
        </button>
      </div>

      {s.stale && s.status === "pending" && (
        <p className="sugg-stale">⚠ The page was edited after this suggestion was written. Make sure approving it won't undo the newer changes.</p>
      )}
      {s.status !== "pending" && (
        <p className="review-meta">
          {s.status === "approved" ? "Approved" : "Declined"} {relativeTime(s.reviewedAt)}
          {s.reviewNote && ` — “${s.reviewNote}”`}
        </p>
      )}

      {open && s.current !== null && <DiffView before={s.current} after={s.body} />}
      {open && s.current === null && <p className="md-status">The page no longer exists.</p>}

      {s.status === "pending" && (
        <div className="sugg-actions">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="Note to the author (optional, shown in their notification)"
            aria-label="Note to the author"
          />
          <button type="button" className="btn btn--sm" disabled={busy} onClick={() => decide("reject")}>
            Decline
          </button>
          <button type="button" className="btn btn--primary btn--sm" disabled={busy || s.current === null} onClick={() => decide("approve")}>
            Approve &amp; publish
          </button>
        </div>
      )}
      {error && <p className="comment-error">{error}</p>}
    </li>
  );
}

export default function SuggestionsPage() {
  const [tab, setTab] = useState("pending");
  // Keyed by tab, so switching tabs shows "Loading…" without resetting state
  // inside the effect, and a late response for the old tab is ignored.
  const [loaded, setLoaded] = useState({ tab: null, list: null, version: 0 });
  const [version, setVersion] = useState(0);
  const [error, setError] = useState(null);
  const list = loaded.tab === tab && loaded.version === version ? loaded.list : null;
  const load = () => setVersion((v) => v + 1);

  useEffect(() => {
    let cancelled = false;
    fetchSuggestions(tab)
      .then((l) => !cancelled && setLoaded({ tab, list: l, version }))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [tab, version]);

  return (
    <StaffPage
      title="Suggested edits"
      intro="Edits members sent for review instead of publishing. Approving publishes it under the author's name; they're notified either way."
    >
      <div className="member-views" role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>
      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}
      {!list && !error && <p className="md-status">Loading…</p>}
      {list?.length === 0 && (
        <div className="empty-state empty-state--boxed">
          <p>
            <strong>{tab === "pending" ? "Nothing waiting for review." : "Nothing here yet."}</strong>
          </p>
        </div>
      )}
      <ul className="sugg-list">
        {list?.map((s) => (
          <Suggestion key={s._id} s={s} onDone={load} />
        ))}
      </ul>
    </StaffPage>
  );
}
