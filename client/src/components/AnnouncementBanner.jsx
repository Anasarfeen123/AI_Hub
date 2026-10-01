import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAnnouncement } from "../api";

const DISMISSED_KEY = "aihub-dismissed-announcement";

function readDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY);
  } catch {
    return null;
  }
}

// The leads' current notice. Dismissal is remembered per announcement, so a
// new one always shows even if the member closed the last.
export default function AnnouncementBanner() {
  const [a, setA] = useState(null);
  const [dismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    fetchAnnouncement()
      .then(setA)
      .catch(() => setA(null));
  }, []);

  if (!a || dismissed === a._id) return null;

  function dismiss() {
    setDismissed(a._id);
    try {
      localStorage.setItem(DISMISSED_KEY, a._id);
    } catch {
      // Without storage it simply comes back on the next visit.
    }
  }

  const icon = { info: "📣", success: "🎉", warning: "⚠️" }[a.tone] || "📣";
  const internal = a.link?.startsWith("/");

  return (
    <div className={`announce announce--${a.tone}`} role="status">
      <span className="announce-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="announce-text">
        {a.text}
        {a.link &&
          (internal ? (
            <Link to={a.link} className="announce-link">
              Open →
            </Link>
          ) : (
            <a href={a.link} target="_blank" rel="noreferrer" className="announce-link">
              Open →
            </a>
          ))}
      </span>
      <button type="button" className="announce-close" onClick={dismiss} aria-label="Dismiss announcement">
        ×
      </button>
    </div>
  );
}
