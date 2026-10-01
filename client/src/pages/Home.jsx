import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import TopNav from "../components/TopNav";
import Roadmap from "../components/Roadmap";
import { useAuth } from "../context/AuthContext";
import { fetchBookmarks } from "../api";
import useDocumentTitle from "../hooks/useDocumentTitle";
import micLogo from "../assets/mic-logo.png";

function SavedStrip() {
  const [marks, setMarks] = useState([]);

  useEffect(() => {
    fetchBookmarks()
      .then(setMarks)
      .catch(() => setMarks([]));
  }, []);

  if (marks.length === 0) return null;

  return (
    <div className="hub-section">
      <div className="hub-section-head">
        <h2>Saved for later</h2>
        <Link to="/saved">See all</Link>
      </div>
      <div className="saved-strip">
        {marks.slice(0, 6).map((b) => (
          <Link key={b.slug} to={`/${b.slug}`} className="saved-chip">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z" />
            </svg>
            {b.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  useDocumentTitle("");
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0];

  return (
    <>
      <Header />
      <TopNav />
      <main id="main">
        <div className="hub-hero">
          <img src={micLogo} alt="" width="88" height="64" />
          <span className="hub-eyebrow">Microsoft Innovations Club — VIT Chennai</span>
          <h1>{firstName ? `Welcome back, ${firstName}` : "AI/ML Resource Hub"}</h1>
          <p>
            A single, maintained place to learn Artificial Intelligence — from your first line of
            Python to reading and writing research papers.
          </p>
          <p className="hub-hero-tip">
            Press <kbd>/</kbd> anywhere to search every page.
          </p>
        </div>

        <SavedStrip />

        <div className="hub-section">
          <h2 id="your-roadmap">Your roadmap</h2>
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
