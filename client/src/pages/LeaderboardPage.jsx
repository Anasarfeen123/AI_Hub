import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Header from "../components/Header";
import TopNav from "../components/TopNav";
import RoleBadge from "../components/RoleBadge";
import { useAuth } from "../context/AuthContext";
import { fetchLeaderboard, fetchMyStats } from "../api";

function num(n) {
  return (n || 0).toLocaleString();
}

export default function LeaderboardPage() {
  const { user, loading: authLoading } = useAuth();

  const [data, setData] = useState(null);
  const [mine, setMine] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([fetchLeaderboard(), fetchMyStats()])
      .then(([board, me]) => {
        setData(board);
        setMine(me);
      })
      .catch((err) => setError(err.message));
  }, [user]);

  // Bars are scaled against the leader, so the top row is always full width and
  // the rest read as a share of it.
  const top = data?.leaders?.[0]?.wordsAdded || 0;

  const myRow = useMemo(
    () => data?.leaders?.find((l) => l.email?.toLowerCase() === user?.email?.toLowerCase()),
    [data, user]
  );

  if (authLoading) return <div className="hub-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <Header />
      <TopNav />
      <div className="editor-wrap">
        <h1>Contributors</h1>
        <p className="editor-note">
          Ranked by how much writing each member has added to the hub — words, not saves. The
          original imported markdown isn't counted, and reverting someone else's work credits
          them, not you.
        </p>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        {!data && !error && <p className="md-status">Loading…</p>}

        {mine && (
          <dl className="stat-grid">
            <div className="stat-cell">
              <dt>Your rank</dt>
              <dd>
                {mine.rank ? `#${mine.rank}` : "—"}
                {data?.totals?.contributors ? <small> of {data.totals.contributors}</small> : null}
              </dd>
            </div>
            <div className="stat-cell">
              <dt>Words added</dt>
              <dd>{num(mine.totals.wordsAdded)}</dd>
            </div>
            <div className="stat-cell">
              <dt>Lines added</dt>
              <dd>{num(mine.totals.linesAdded)}</dd>
            </div>
            <div className="stat-cell">
              <dt>Pages touched</dt>
              <dd>{num(mine.totals.pagesTouched)}</dd>
            </div>
            <div className="stat-cell">
              <dt>Your edits</dt>
              <dd>{num(mine.totals.edits)}</dd>
            </div>
          </dl>
        )}

        {mine && mine.totals.edits === 0 && (
          <p className="admin-notice">
            You haven't edited a page yet. Open any page and hit <strong>Edit</strong> — every
            member can, no approval needed.
          </p>
        )}

        {data && data.leaders.length === 0 && (
          <p className="md-status">No contributions yet. Be the first.</p>
        )}

        {data && data.leaders.length > 0 && (
          <div className="lb-list">
            {data.leaders.map((l) => {
              const isMe = l.email?.toLowerCase() === user.email?.toLowerCase();
              return (
                <div
                  className={`lb-row lb-row--${l.rank}${isMe ? " lb-row--me" : ""}`}
                  key={l.email}
                >
                  <div className="lb-rank">{l.rank}</div>
                  <div className="lb-who">
                    <div className="lb-name">
                      <span>{l.name}</span>
                      <RoleBadge role={l.role} />
                      {isMe && <span className="you-pill">you</span>}
                    </div>
                    <div className="lb-meta">
                      {num(l.linesAdded)} lines · {l.pagesTouched} page
                      {l.pagesTouched === 1 ? "" : "s"} · {l.edits} edit{l.edits === 1 ? "" : "s"}
                      {l.department ? ` · ${l.department}` : ""}
                    </div>
                  </div>
                  <div className="lb-score">
                    <div className="lb-words">
                      {num(l.wordsAdded)}
                      <small>words</small>
                    </div>
                    <div
                      className="lb-bar"
                      style={{ width: `${top ? Math.max(2, (l.wordsAdded / top) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {mine?.pages?.length > 0 && (
          <>
            <h2 style={{ marginTop: "2.5rem" }}>Your pages</h2>
            <div className="lb-list">
              {mine.pages.map((p) => (
                <div className="lb-row" key={p.slug}>
                  <div className="lb-rank" aria-hidden="true">
                    ·
                  </div>
                  <div className="lb-who">
                    <div className="lb-name">
                      <Link to={`/${p.slug}`}>{p.slug}</Link>
                    </div>
                    <div className="lb-meta">
                      {p.edits} edit{p.edits === 1 ? "" : "s"} · {num(p.linesAdded)} lines
                    </div>
                  </div>
                  <div className="lb-score">
                    <div className="lb-words">
                      {num(p.wordsAdded)}
                      <small>words</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
