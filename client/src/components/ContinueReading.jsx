import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRecent } from "../api";
import { relativeTime } from "../lib/format";

// The last few pages a member read, with how far through each they got.
// Opening one offers to jump back to that spot.
export default function ContinueReading() {
  const [recent, setRecent] = useState(null);

  useEffect(() => {
    fetchRecent()
      .then(setRecent)
      .catch(() => setRecent([]));
  }, []);

  if (!recent?.length) return null;

  return (
    <section className="home-card">
      <div className="home-card-head">
        <h2>Continue reading</h2>
      </div>
      <ul className="recent-list">
        {recent.slice(0, 4).map((r) => (
          <li key={r.slug}>
            <Link to={`/${r.slug}`} className="recent-item">
              <span className="recent-title">{r.title}</span>
              <span className="recent-meta">
                {r.scroll >= 0.97 ? "Finished" : r.scroll > 0.05 ? `${Math.round(r.scroll * 100)}% through` : "Opened"} ·{" "}
                {relativeTime(r.readAt)}
              </span>
              <span className="recent-track" aria-hidden="true">
                <span style={{ width: `${Math.max(4, Math.round(r.scroll * 100))}%` }} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
