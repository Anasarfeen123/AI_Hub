import { useCallback, useEffect, useRef, useState } from "react";
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
import { useNav } from "../context/NavContext";
import { findInNav } from "../lib/nav";
import { fetchPage } from "../api";
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
                  <a className="page-meta-comments" href="#discussion">
                    {shownCount === 0 ? "No comments yet" : `${shownCount} comment${shownCount === 1 ? "" : "s"}`}
                  </a>
                </div>

                {/* The roadmap page leads with the interactive tree; the
                    written version below it stays editable like any other page. */}
                {slug === "roadmap" && <RoadmapTree />}

                <div className="md-body">
                  <Markdown body={page.body} linkBase={page.linkBase} />
                </div>

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
