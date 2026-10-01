import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StaffPage from "../components/StaffPage";
import { fetchOverview, fetchAudit, fetchAnnouncement, postAnnouncement, clearAnnouncement } from "../api";
import { relativeTime } from "../lib/format";

function Tile({ label, value, sub }) {
  return (
    <div className="ov-tile">
      <span className="ov-tile-label">{label}</span>
      <strong className="ov-tile-value">{value}</strong>
      {sub && <span className="ov-tile-sub">{sub}</span>}
    </div>
  );
}

function AnnouncementCard() {
  const [current, setCurrent] = useState(undefined);
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [tone, setTone] = useState("info");
  const [days, setDays] = useState("7");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    fetchAnnouncement()
      .then(setCurrent)
      .catch(() => setCurrent(null));
  }, []);

  useEffect(load, [load]);

  async function post(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await postAnnouncement({ text, link, tone, days: Number(days) });
      setText("");
      setLink("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    if (!window.confirm("Take this announcement down for everyone?")) return;
    setBusy(true);
    try {
      await clearAnnouncement();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ov-card">
      <div className="ov-card-head">
        <h2>Announcement</h2>
        <span className="ov-card-hint">Shown at the top of every member's home page</span>
      </div>

      {current && (
        <div className={`announce announce--${current.tone} ov-current`}>
          <span className="announce-text">{current.text}</span>
          <button type="button" className="btn btn--sm" onClick={clear} disabled={busy}>
            Take down
          </button>
        </div>
      )}
      {current === null && <p className="md-status">Nothing posted right now.</p>}

      <form className="ov-announce-form" onSubmit={post}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={280}
          rows={2}
          placeholder="e.g. Kickoff meetup this Friday, 5pm in the AB1 lab — bring a laptop!"
          aria-label="Announcement text"
        />
        <div className="ov-announce-row">
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Link (optional) — /roadmap or https://…"
            aria-label="Announcement link"
          />
          <select value={tone} onChange={(e) => setTone(e.target.value)} aria-label="Style">
            <option value="info">Info</option>
            <option value="success">Good news</option>
            <option value="warning">Important</option>
          </select>
          <select value={days} onChange={(e) => setDays(e.target.value)} aria-label="Show for">
            <option value="1">Show for 1 day</option>
            <option value="3">Show for 3 days</option>
            <option value="7">Show for a week</option>
            <option value="30">Show for a month</option>
            <option value="0">Until taken down</option>
          </select>
          <button type="submit" className="btn btn--primary" disabled={busy || !text.trim()}>
            {current ? "Replace" : "Post"}
          </button>
        </div>
        <span className="ov-count">{280 - text.length} characters left</span>
        {error && (
          <p className="comment-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}

function AuditList({ initial }) {
  const [entries, setEntries] = useState(initial);
  const [more, setMore] = useState(initial.length >= 15);
  const [busy, setBusy] = useState(false);

  async function loadMore() {
    setBusy(true);
    try {
      const last = entries[entries.length - 1];
      const data = await fetchAudit(last?.createdAt);
      setEntries((e) => [...e, ...data.entries]);
      setMore(data.more);
    } finally {
      setBusy(false);
    }
  }

  if (entries.length === 0) return <p className="md-status">No admin actions recorded yet.</p>;

  return (
    <>
      <ul className="ov-audit">
        {entries.map((a) => (
          <li key={a._id}>
            <span className="ov-audit-what">
              <strong>{a.actorName || a.actorEmail}</strong> {a.action.toLowerCase()}
              {a.target && <span className="ov-audit-target"> {a.target}</span>}
              {a.details && <span className="ov-audit-details"> · {a.details}</span>}
            </span>
            <time dateTime={a.createdAt} title={new Date(a.createdAt).toLocaleString()}>
              {relativeTime(a.createdAt)}
            </time>
          </li>
        ))}
      </ul>
      {more && (
        <button type="button" className="btn btn--sm ov-more" onClick={loadMore} disabled={busy}>
          {busy ? "Loading…" : "Show older"}
        </button>
      )}
    </>
  );
}

function NeverSignedIn({ people }) {
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(people.map((p) => p.email).join(", "));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const shown = showAll ? people : people.slice(0, 8);

  return (
    <section className="ov-card">
      <div className="ov-card-head">
        <h2>Haven't signed in yet</h2>
        {people.length > 0 && (
          <button type="button" className="btn btn--sm" onClick={copy}>
            {copied ? "Copied!" : `Copy ${people.length} email${people.length === 1 ? "" : "s"}`}
          </button>
        )}
      </div>
      {people.length === 0 ? (
        <p className="md-status">Everyone on the list has signed in at least once. 🎉</p>
      ) : (
        <>
          <p className="ov-card-hint ov-card-hint--block">
            Paste the emails into a reminder mail, or check the address is the one they use with Google.
          </p>
          <ul className="ov-people">
            {shown.map((p) => (
              <li key={p.email}>
                <strong>{p.name}</strong>
                <span>{p.email}</span>
              </li>
            ))}
          </ul>
          {people.length > 8 && (
            <button type="button" className="btn btn--sm ov-more" onClick={() => setShowAll((s) => !s)}>
              {showAll ? "Show fewer" : `Show all ${people.length}`}
            </button>
          )}
        </>
      )}
    </section>
  );
}

function PageList({ title, rows, unit, empty }) {
  return (
    <section className="ov-card">
      <div className="ov-card-head">
        <h2>{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="md-status">{empty}</p>
      ) : (
        <ol className="ov-pages">
          {rows.map((r) => (
            <li key={r.slug}>
              <Link to={`/${r.slug}`}>{r.title}</Link>
              <span>
                {r.count} {unit}
                {r.count === 1 ? "" : "s"}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default function OverviewPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOverview()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <StaffPage title="Overview" wide intro="How the hub is doing, at a glance — and the tools for running it.">
      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}
      {!data && !error && <p className="md-status">Loading…</p>}

      {data && (
        <>
          <div className="ov-tiles">
            <Tile label="Active members" value={data.members.active} sub={`${data.members.total} on the list`} />
            <Tile label="Active this week" value={data.members.signedInWeek} sub="used the hub in the last 7 days" />
            <Tile label="Not signed in yet" value={data.members.neverSignedIn} sub="active members" />
            <Tile label="Edits" value={data.content.editsWeek} sub={`this week · ${data.content.editsMonth} this month`} />
            <Tile label="Comments" value={data.content.commentsWeek} sub={`this week · ${data.content.commentsTotal} in total`} />
            <Tile
              label="Pages"
              value={data.content.pages}
              sub={data.content.hiddenPages ? `${data.content.hiddenPages} hidden` : `${data.content.bookmarksTotal} saves`}
            />
          </div>

          <AnnouncementCard />

          <div className="ov-grid">
            <NeverSignedIn people={data.neverSignedIn} />
            <div className="ov-stack">
              <PageList title="Most discussed" rows={data.topCommented} unit="comment" empty="No comments yet." />
              <PageList title="Most saved" rows={data.topSaved} unit="save" empty="Nobody has saved a page yet." />
            </div>
          </div>

          <section className="ov-card">
            <div className="ov-card-head">
              <h2>Admin activity</h2>
              <span className="ov-card-hint">Role changes, removals, page deletions, restores, moderation</span>
            </div>
            <AuditList initial={data.recentAudit} />
          </section>
        </>
      )}
    </StaffPage>
  );
}
