import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import TopNav from "../components/TopNav";
import { fetchFlags, resolveFlag } from "../api";
import { useAuth } from "../context/AuthContext";
import { isStaff } from "../lib/roles";
import { relativeTime } from "../lib/format";
import useDocumentTitle from "../hooks/useDocumentTitle";

const LABEL = {
  outdated: "Out of date",
  incomplete: "Missing something",
  "broken-link": "Broken link",
  unclear: "Hard to follow",
  other: "Something else",
};

// Where contributors start: every page someone has flagged as needing work,
// grouped by page, oldest first.
export default function HelpWantedPage() {
  useDocumentTitle("Help wanted");
  const { user } = useAuth();
  const [flags, setFlags] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFlags()
      .then(setFlags)
      .catch((err) => setError(err.message));
  }, []);

  const pages = useMemo(() => {
    const by = new Map();
    for (const f of flags || []) {
      if (!by.has(f.slug)) by.set(f.slug, { slug: f.slug, title: f.title, flags: [] });
      by.get(f.slug).flags.push(f);
    }
    return [...by.values()].sort((a, b) => b.flags.length - a.flags.length);
  }, [flags]);

  async function resolve(id) {
    try {
      await resolveFlag(id);
      setFlags((list) => list.filter((f) => f._id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  const staff = isStaff(user?.role);

  return (
    <>
      <Header />
      <TopNav />
      <main id="main" className="editor-wrap">
        <h1>Help wanted</h1>
        <p className="editor-note">
          Pages members have flagged as needing work. Pick one, hit <strong>Edit</strong>, and mark the note fixed when
          you're done — every word you add counts on the contributors board.
        </p>
        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        {!flags && !error && <p className="md-status">Loading…</p>}
        {flags?.length === 0 && (
          <div className="empty-state empty-state--boxed">
            <p>
              <strong>Nothing flagged right now. 🎉</strong>
            </p>
            <p className="md-status">Spot something wrong on a page? Use “Flag this page” at the bottom of it.</p>
          </div>
        )}
        <ul className="help-list">
          {pages.map((p) => (
            <li key={p.slug} className="help-page">
              <div className="help-page-head">
                <Link to={`/${p.slug}`}>{p.title}</Link>
                <Link className="btn btn--sm" to={`/edit/${p.slug}`}>
                  Edit page
                </Link>
              </div>
              <ul>
                {p.flags.map((f) => (
                  <li key={f._id}>
                    <span className="flag-kind">{LABEL[f.kind]}</span>
                    {f.note && <span className="flag-note">“{f.note}”</span>}
                    <span className="flag-meta">
                      {f.createdByName} · {relativeTime(f.createdAt)}
                    </span>
                    {(f.mine || staff) && (
                      <button type="button" className="flag-resolve" onClick={() => resolve(f._id)}>
                        Mark fixed
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
