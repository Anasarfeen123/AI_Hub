import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import TopNav from "../components/TopNav";
import RoleBadge from "../components/RoleBadge";
import { fetchProfile, saveSettings, fetchMySuggestions } from "../api";
import { initials, relativeTime } from "../lib/format";
import useDocumentTitle from "../hooks/useDocumentTitle";

const WEEKS = 16;
const DAY = 86400000;

// India-time calendar day, matching how the server records activity.
const dayKey = (d) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

// A GitHub-style grid of the last 16 weeks: a filled square for each day the
// member used the hub. Binary on purpose — it's about showing up, not volume.
function ActivityGrid({ days }) {
  const active = useMemo(() => new Set(days), [days]);
  const cols = useMemo(() => {
    const today = new Date();
    const mondayOffset = (Number(new Date(`${dayKey(today)}T00:00:00Z`).getUTCDay()) + 6) % 7;
    const start = new Date(today.getTime() - ((WEEKS - 1) * 7 + mondayOffset) * DAY);
    return Array.from({ length: WEEKS }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const date = new Date(start.getTime() + (w * 7 + d) * DAY);
        const key = dayKey(date);
        return { key, future: date > today, on: active.has(key) };
      })
    );
  }, [active]);
  const count = cols.flat().filter((c) => c.on).length;

  return (
    <div className="activity">
      <div className="activity-grid" role="img" aria-label={`Active on ${count} days in the last ${WEEKS} weeks`}>
        {cols.map((week, i) => (
          <div className="activity-week" key={i}>
            {week.map((d) => (
              <span
                key={d.key}
                className={`activity-day${d.on ? " is-on" : ""}${d.future ? " is-future" : ""}`}
                title={d.future ? "" : `${new Date(`${d.key}T12:00:00`).toDateString()}${d.on ? " — active" : ""}`}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="activity-caption">
        Active on <strong>{count}</strong> day{count === 1 ? "" : "s"} in the last {WEEKS} weeks
      </p>
    </div>
  );
}

function Toggle({ checked, onChange, label, hint, busy }) {
  return (
    <label className="setting">
      <span className="setting-text">
        <strong>{label}</strong>
        <span>{hint}</span>
      </span>
      <input type="checkbox" className="switch" checked={checked} disabled={busy} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

const STATUS = { pending: "Waiting for review", approved: "Approved", rejected: "Not accepted" };

export default function ProfilePage() {
  useDocumentTitle("Your profile");
  const [p, setP] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  useEffect(() => {
    fetchProfile()
      .then(setP)
      .catch((err) => setError(err.message));
    fetchMySuggestions()
      .then(setSuggestions)
      .catch(() => setSuggestions([]));
  }, []);

  // Jump to #settings when linked from elsewhere, once the page has rendered.
  useEffect(() => {
    if (p && window.location.hash === "#settings") document.getElementById("settings")?.scrollIntoView();
  }, [p]);

  async function change(key, value) {
    setBusy(true);
    try {
      const settings = await saveSettings({ [key]: value });
      setP((prev) => ({ ...prev, settings }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const earned = p?.badges.filter((b) => b.earned).length || 0;

  return (
    <>
      <Header />
      <TopNav />
      <main id="main" className="editor-wrap profile">
        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        {!p && !error && <p className="md-status">Loading…</p>}

        {p && (
          <>
            <section className="profile-head">
              <span className="profile-avatar" aria-hidden="true">
                {initials(p.name)}
              </span>
              <div>
                <h1>
                  {p.name} <RoleBadge role={p.role} />
                </h1>
                <p className="md-status">
                  {p.email}
                  {p.memberSince && ` · member since ${new Date(p.memberSince).toLocaleDateString(undefined, { month: "long", year: "numeric" })}`}
                </p>
              </div>
            </section>

            <div className="profile-stats">
              <div className="ov-tile">
                <span className="ov-tile-label">Streak</span>
                <strong className="ov-tile-value">
                  {p.streak} {p.streak === 1 ? "week" : "weeks"}
                </strong>
                <span className="ov-tile-sub">{p.streak ? "in a row 🔥" : "use the hub this week to start one"}</span>
              </div>
              <div className="ov-tile">
                <span className="ov-tile-label">Roadmap</span>
                <strong className="ov-tile-value">
                  {p.progress.done}/{p.progress.total}
                </strong>
                <span className="ov-tile-sub">topics complete</span>
              </div>
              <div className="ov-tile">
                <span className="ov-tile-label">Written</span>
                <strong className="ov-tile-value">{p.stats.wordsAdded.toLocaleString()}</strong>
                <span className="ov-tile-sub">
                  words · {p.stats.edits} edit{p.stats.edits === 1 ? "" : "s"}
                </span>
              </div>
              <div className="ov-tile">
                <span className="ov-tile-label">Community</span>
                <strong className="ov-tile-value">{p.stats.comments}</strong>
                <span className="ov-tile-sub">
                  comments · {p.stats.ratings} helpful mark{p.stats.ratings === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            <section className="ov-card">
              <div className="ov-card-head">
                <h2>Activity</h2>
                <span className="ov-card-hint">A streak counts weeks, not days — miss a day, keep the streak</span>
              </div>
              <ActivityGrid days={p.activeDays} />
            </section>

            <section className="ov-card">
              <div className="ov-card-head">
                <h2>Badges</h2>
                <span className="ov-card-hint">
                  {earned} of {p.badges.length} earned
                </span>
              </div>
              <ul className="badges">
                {p.badges.map((b) => (
                  <li key={b.id} className={`badge${b.earned ? " is-earned" : ""}`} title={b.desc}>
                    <span className="badge-icon" aria-hidden="true">
                      {b.icon}
                    </span>
                    <strong>{b.name}</strong>
                    <span>{b.desc}</span>
                    {!b.earned && <span className="sr-only">(not earned yet)</span>}
                  </li>
                ))}
              </ul>
            </section>

            <section className="ov-card" id="settings">
              <div className="ov-card-head">
                <h2>Settings</h2>
              </div>
              <Toggle
                label="Show me in “Learning alongside you”"
                hint="Other members who also opt in can see your name and which stage you're on. Nothing else."
                checked={p.settings.shareProgress}
                busy={busy}
                onChange={(v) => change("shareProgress", v)}
              />
              <Toggle
                label="Reminder emails"
                hint="An occasional nudge if you haven't visited in two weeks. Never more than one a fortnight."
                checked={p.settings.emailReminders}
                busy={busy}
                onChange={(v) => change("emailReminders", v)}
              />
            </section>

            <section className="ov-card">
              <div className="ov-card-head">
                <h2>Edits sent for review</h2>
                <Link to="/notes" className="home-card-link">
                  My notes →
                </Link>
              </div>
              {!suggestions?.length ? (
                <p className="md-status">
                  None yet. When editing a page you can choose “Send for review” instead of publishing straight away.
                </p>
              ) : (
                <ul className="ov-pages">
                  {suggestions.map((s) => (
                    <li key={s._id}>
                      <Link to={`/${s.slug}`}>{s.title}</Link>
                      <span className={`sugg-status sugg-status--${s.status}`}>
                        {STATUS[s.status]} · {relativeTime(s.reviewedAt || s.createdAt)}
                        {s.reviewNote ? ` — “${s.reviewNote}”` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
