import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import Markdown from "../components/Markdown";
import Header from "../components/Header";
import TopNav from "../components/TopNav";
import SectionSidebar from "../components/SectionSidebar";
import PageByline from "../components/PageByline";
import RoadmapTree from "../components/RoadmapTree";
import BookmarkButton from "../components/BookmarkButton";
import TableOfContents from "../components/TableOfContents";
import Comments from "../components/Comments";
import NotesPanel from "../components/NotesPanel";
import FlagPanel from "../components/FlagPanel";
import { PageContext } from "../context/PageContext";
import useReadingTracker from "../hooks/useReadingTracker";
import { useNav } from "../context/NavContext";
import { findInNav } from "../lib/nav";
import { fetchPage, fetchRatings, rateLink, fetchReadingPosition } from "../api";
import useDocumentTitle from "../hooks/useDocumentTitle";

function PageSkeleton() {
  return (
    <div className="skeleton" aria-busy="true" aria-label="Loading page">
      <div className="skeleton-line skeleton-line--title" />
      <div className="skeleton-line skeleton-line--short" />
      <div className="skeleton-gap" />
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <div className="skeleton-line skeleton-line--mid" />
      <div className="skeleton-gap" />
      <div className="skeleton-line" />
      <div className="skeleton-line skeleton-line--mid" />
    </div>
  );
}

export default function ContentPage() {
  const location = useLocation();
  const slug = location.pathname.replace(/^\/+|\/+$/g, "");
  const { nav } = useNav();
  const match = findInNav(nav, slug);
  const articleRef = useRef(null);

  // Keyed by slug, so a stale response for the previous page is never shown
  // and there's no synchronous reset inside the effect.
  const [result, setResult] = useState({ slug: null, page: null, error: null });
  const [commentCount, setCommentCount] = useState({ slug: null, n: 0 });
  const loading = result.slug !== slug;
  const page = loading ? null : result.page;
  const error = loading ? null : result.error;

  useEffect(() => {
    let cancelled = false;
    fetchPage(slug)
      .then((p) => !cancelled && setResult({ slug, page: p, error: null }))
      .catch((err) => !cancelled && setResult({ slug, page: null, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useDocumentTitle(page?.title || match?.page?.title || (error ? "Page not available" : ""));

  // In an SPA the browser can't jump to #section on load, because the heading
  // doesn't exist until the page has been fetched and rendered.
  useEffect(() => {
    if (!page || !location.hash) return;
    const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el) requestAnimationFrame(() => el.scrollIntoView());
  }, [page, location.hash]);

  useReadingTracker(slug, Boolean(page));

  // "Continue where you left off": if they'd read part of this page before,
  // offer to jump back — unless a #link already says where to go.
  const [resume, setResume] = useState({ slug: null, at: 0 });
  useEffect(() => {
    if (!page || location.hash) return undefined;
    let cancelled = false;
    fetchReadingPosition(slug)
      .then((r) => !cancelled && r.scroll > 0.08 && r.scroll < 0.97 && setResume({ slug, at: r.scroll }))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [page, slug, location.hash]);
  const resumeAt = resume.slug === slug ? resume.at : 0;

  function jumpBack() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: max * resumeAt });
    setResume({ slug: null, at: 0 });
  }

  // Resource ratings for the "helped me" buttons, shared with the renderer.
  const [ratings, setRatings] = useState({ slug: null, map: {} });
  useEffect(() => {
    if (!page) return undefined;
    let cancelled = false;
    fetchRatings(slug)
      .then((map) => !cancelled && setRatings({ slug, map }))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [page, slug]);
  const rate = useCallback(
    async (url, helpful) => {
      const r = await rateLink(slug, url, helpful);
      setRatings((prev) => ({ slug, map: { ...prev.map, [url]: { count: r.count, mine: r.mine } } }));
    },
    [slug]
  );
  const pageContext = useMemo(
    () => ({ slug, ratings: ratings.slug === slug ? ratings.map : {}, rate }),
    [slug, ratings, rate]
  );

  const [notesOpen, setNotesOpen] = useState({ slug: null });
  const showNotes = notesOpen.slug === slug;

  // ~220 words a minute, ignoring code and link targets.
  const minutes = useMemo(() => {
    if (!page) return 0;
    const words = page.body.replace(/```[\s\S]*?```/g, " ").replace(/\]\([^)]*\)/g, "]").split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
  }, [page]);

  const onCountChange = useCallback((n) => setCommentCount({ slug, n }), [slug]);
  const shownCount = commentCount.slug === slug ? commentCount.n : page?.commentCount ?? 0;

  return (
    <>
      <Header />
      <TopNav />
      <div className="content-layout">
        <SectionSidebar section={match?.section} />
        <main id="main" className="content-main">
          <article
            ref={articleRef}
            data-page-slug={page ? slug : undefined}
            className={`md-content${slug === "roadmap" ? " md-content--wide" : ""}`}
          >
            {loading && <PageSkeleton />}

            {error && (
              <div className="empty-state empty-state--page">
                <p className="empty-state-code" aria-hidden="true">
                  {/not found/i.test(error) ? "404" : "Oops"}
                </p>
                <h1>{/not found/i.test(error) ? "This page doesn't exist" : "Page not available"}</h1>
                <p className="md-status">
                  {/not found/i.test(error)
                    ? `Nothing lives at /${slug}. It may have been moved or renamed — try searching for it.`
                    : error}
                </p>
                <div className="empty-state-actions">
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => window.dispatchEvent(new Event("aihub:open-search"))}
                  >
                    Search the hub
                  </button>
                  <Link className="btn" to="/">
                    Go home
                  </Link>
                </div>
              </div>
            )}

            {page && (
              <>
                <div className="md-content-head">
                  <h1>{page.title || match?.page?.title || slug}</h1>
                  <div className="md-actions">
                    <button
                      type="button"
                      className={`md-action-btn${showNotes ? " is-on" : ""}`}
                      onClick={() => setNotesOpen({ slug: showNotes ? null : slug })}
                      aria-expanded={showNotes}
                      title="Private notes on this page"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
                        <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" />
                        <path d="M14 3v5h5M8 13h8M8 17h5" />
                      </svg>
                      Notes
                    </button>
                    <BookmarkButton key={slug} slug={slug} initial={page.saved} />
                    <Link className="md-action-btn" to={`/edit/${slug}`} title="Edit this page">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                      </svg>
                      Edit
                    </Link>
                  </div>
                </div>
                <div className="page-meta">
                  <PageByline page={page} />
                  <span className="page-meta-right">
                    <span className="page-meta-time">{minutes} min read</span>
                    <a className="page-meta-comments" href="#discussion">
                      {shownCount === 0 ? "No comments yet" : `${shownCount} comment${shownCount === 1 ? "" : "s"}`}
                    </a>
                  </span>
                </div>

                {resumeAt > 0 && (
                  <button type="button" className="resume-pill" onClick={jumpBack}>
                    ↓ Continue where you left off ({Math.round(resumeAt * 100)}% through)
                  </button>
                )}

                {showNotes && <NotesPanel slug={slug} onClose={() => setNotesOpen({ slug: null })} />}

                {/* The roadmap page leads with the interactive tree; the
                    written version below it stays editable like any other page. */}
                {slug === "roadmap" && <RoadmapTree />}

                <PageContext.Provider value={pageContext}>
                  <div className="md-body">
                    <Markdown body={page.body} linkBase={page.linkBase} />
                  </div>
                </PageContext.Provider>

                <FlagPanel key={`flags-${slug}`} slug={slug} />

                <Comments key={slug} slug={slug} onCountChange={onCountChange} />
              </>
            )}
          </article>
        </main>
        {page && slug !== "roadmap" && <TableOfContents containerRef={articleRef} page={page} />}
      </div>
    </>
  );
}
