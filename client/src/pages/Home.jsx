import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import TopNav from "../components/TopNav";
import Roadmap from "../components/Roadmap";
import { useAuth } from "../context/AuthContext";
import { fetchBookmarks } from "../api";
import { useRoadmapProgress, useRoadmapStages, toRoute } from "../hooks/useRoadmap";
import useDocumentTitle from "../hooks/useDocumentTitle";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// A ring rather than a bar, so it reads at a glance beside the greeting.
function ProgressRing({ pct }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg className="home-ring" viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
      <circle cx="40" cy="40" r={r} className="home-ring-track" />
      <circle
        cx="40"
        cy="40"
        r={r}
        className="home-ring-fill"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
      />
      <text x="40" y="45" textAnchor="middle" className="home-ring-text">
        {pct}%
      </text>
    </svg>
  );
}

function Welcome() {
  const { user } = useAuth();
  const stages = useRoadmapStages();
  const { progress } = useRoadmapProgress();
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    fetchBookmarks()
      .then(setSaved)
      .catch(() => setSaved([]));
  }, []);

  // The first topic not yet ticked, in roadmap order, is the natural next step.
  const { total, done, next, nextStage } = useMemo(() => {
    const all = (stages || []).flatMap((s) => s.nodes.map((n) => ({ ...n, stage: s })));
    const firstOpen = all.find((n) => !progress[n.id]);
    return {
      total: all.length,
      done: all.filter((n) => progress[n.id]).length,
      next: firstOpen,
      nextStage: firstOpen?.stage,
    };
  }, [stages, progress]);

  const pct = total ? Math.round((done / total) * 100) : 0;
  const firstName = user?.name?.split(" ")[0];

  return (
    <section className="home-welcome">
      <div className="home-welcome-glow" aria-hidden="true" />
      <div className="home-welcome-main">
        <p className="home-kicker">Microsoft Innovations Club · AI/ML</p>
        <h1>
          {greeting()}
          {firstName ? `, ${firstName}` : ""}.
        </h1>
        <p className="home-sub">
          {stages === null
            ? "Loading your roadmap…"
            : total === 0
              ? "The roadmap is being set up — check back soon."
              : done === 0
                ? "Start at the beginning — every topic builds on the one before it."
                : done === total
                  ? "You've finished every topic on the roadmap. Time to write something new for the hub?"
                  : `You've completed ${done} of ${total} topics. Keep the streak going.`}
        </p>

        <div className="home-actions">
          {next && (
            <Link className="home-next" to={toRoute(next.href)}>
              <span className={`home-next-stage home-next-stage--${nextStage.levelClass}`}>
                Up next · {nextStage.label}
              </span>
              <strong>{next.title}</strong>
              <span className="home-next-desc">{next.desc}</span>
              <span className="home-next-go" aria-hidden="true">
                →
              </span>
            </Link>
          )}

          <div className="home-quick">
            <Link to="/roadmap" className="home-quick-item">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M4 6h10M4 12h16M4 18h7" />
              </svg>
              Full roadmap
            </Link>
            <Link to="/saved" className="home-quick-item">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z" />
              </svg>
              Saved{saved?.length ? ` · ${saved.length}` : ""}
            </Link>
            <Link to="/contributors" className="home-quick-item">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
                <path d="M17 6h3v2a3 3 0 0 1-3 3M7 6H4v2a3 3 0 0 0 3 3" />
              </svg>
              Contributors
            </Link>
          </div>
        </div>
      </div>

      {total > 0 && (
        <div className="home-progress">
          <ProgressRing pct={pct} />
          <div>
            <strong>
              {done}/{total}
            </strong>
            <span>topics complete</span>
          </div>
        </div>
      )}

      {saved?.length > 0 && (
        <div className="home-saved">
          <span className="home-saved-label">Saved for later</span>
          {saved.slice(0, 5).map((b) => (
            <Link key={b.slug} to={`/${b.slug}`} className="saved-chip">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
                <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z" />
              </svg>
              {b.title}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default function Home() {
  useDocumentTitle("");

  return (
    <>
      <Header />
      <TopNav />
      <main id="main">
        <div className="hub-section home-top">
          <Welcome />
        </div>

        <div className="hub-section">
          <div className="hub-section-head">
            <h2 id="your-roadmap">Your roadmap</h2>
            <span className="hub-section-hint">
              Press <kbd>/</kbd> to search
            </span>
          </div>
          <p className="hub-section-sub">
            Designed by the AI/ML Vertical Lead. Open any topic, or tick it off to track your progress —
            saved in this browser.
          </p>
          <Roadmap />
        </div>
      </main>
    </>
  );
}
