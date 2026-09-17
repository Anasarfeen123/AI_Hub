import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import Markdown from "../components/Markdown";
import Header from "../components/Header";
import TopNav from "../components/TopNav";
import SectionSidebar from "../components/SectionSidebar";
import PageByline from "../components/PageByline";
import RoadmapTree from "../components/RoadmapTree";
import { useNav, findInNav } from "../context/NavContext";
import { fetchPage } from "../api";

export default function ContentPage() {
  const location = useLocation();
  const slug = location.pathname.replace(/^\/+|\/+$/g, "");
  const { nav } = useNav();
  const match = findInNav(nav, slug);

  const [page, setPage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPage(null);

    fetchPage(slug)
      .then((p) => {
        if (!cancelled) setPage(p);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <>
      <Header />
      <TopNav />
      <div className="content-layout">
        <SectionSidebar section={match?.section} />
        <article className={`md-content${slug === "roadmap" ? " md-content--wide" : ""}`}>
          {loading && <p className="md-status">Loading…</p>}

          {!loading && error && (
            <>
              <h1>Page not available</h1>
              <p className="md-status">{error}</p>
              <p>
                <Link to="/">Back to the homepage</Link>
              </p>
            </>
          )}

          {!loading && page && (
            <>
              <div className="md-content-head">
                <h1>{page.title || match?.page?.title || slug}</h1>
                <Link className="md-edit-btn" to={`/edit/${slug}`} title="Suggest an edit">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                  </svg>
                  Edit
                </Link>
              </div>
              <PageByline page={page} />

              {/* The roadmap page leads with the interactive tree; the
                  written version below it stays editable like any other page. */}
              {slug === "roadmap" && <RoadmapTree />}

              <Markdown body={page.body} linkBase={page.linkBase} />
            </>
          )}
        </article>
      </div>
    </>
  );
}
