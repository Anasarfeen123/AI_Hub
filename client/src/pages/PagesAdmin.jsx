import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Header from "../components/Header";
import TopNav from "../components/TopNav";
import AdminNav from "../components/AdminNav";
import { useAuth } from "../context/AuthContext";
import { useNav } from "../context/NavContext";
import { fetchAllPages, fetchStages, createPage, updatePageMeta, deletePage } from "../api";
import { isStaff } from "../lib/roles";

export default function PagesAdmin() {
  const { user, loading: authLoading } = useAuth();
  const { refresh: refreshNav } = useNav();

  const [pages, setPages] = useState(null);
  const [stages, setStages] = useState([]);
  const [view, setView] = useState("structure");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);
  // Briefly highlights the row that just changed, so an action is visibly
  // confirmed rather than silently reloading the list.
  const [flashId, setFlashId] = useState(null);

  const [form, setForm] = useState({ title: "", section: "", roadmapStage: "", roadmapDesc: "" });
  const [creating, setCreating] = useState(false);

  async function load() {
    setError(null);
    try {
      const [p, s] = await Promise.all([fetchAllPages(), fetchStages()]);
      setPages(p);
      setStages(s);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (isStaff(user?.role)) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function flash(id) {
    setFlashId(id);
    setTimeout(() => setFlashId((cur) => (cur === id ? null : cur)), 1600);
  }

  if (authLoading) return <div className="hub-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isStaff(user.role)) {
    return (
      <>
        <Header />
        <TopNav />
        <div className="editor-wrap">
          <h1>Admins only</h1>
          <p className="md-status">This page is for MIC leads.</p>
        </div>
      </>
    );
  }

  const sections = (pages || []).filter((p) => !p.section).sort((a, b) => a.order - b.order);
  const childrenOf = (slug) =>
    (pages || []).filter((p) => p.section === slug).sort((a, b) => a.order - b.order);
  const topicsIn = (key) =>
    (pages || [])
      .filter((p) => p.roadmapStage === key)
      .sort((a, b) => (a.roadmapOrder ?? 0) - (b.roadmapOrder ?? 0));
  const offRoadmap = (pages || []).filter((p) => !p.roadmapStage);

  async function run(id, fn, msg) {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      await fn();
      await load();
      await refreshNav();
      if (msg) setNotice(msg);
      flash(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setNotice(null);
    try {
      const { page } = await createPage(form);
      setNotice(`Created “${page.title}” at /${page.slug}.`);
      setForm({ title: "", section: "", roadmapStage: "", roadmapDesc: "" });
      await load();
      await refreshNav();
      flash(page._id);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  // Swap with the neighbour on whichever axis is being reordered.
  function move(page, delta, field) {
    const group =
      field === "order" ? childrenOf(page.section).concat(page.section ? [] : sections) : topicsIn(page.roadmapStage);
    const siblings = (field === "order" && !page.section ? sections : group).slice();
    const i = siblings.findIndex((p) => p._id === page._id);
    const j = i + delta;
    if (i === -1 || j < 0 || j >= siblings.length) return;

    const other = siblings[j];
    return run(
      page._id,
      async () => {
        await updatePageMeta(page._id, { [field]: other[field] ?? 0 });
        await updatePageMeta(other._id, { [field]: page[field] ?? 0 });
      },
      `Moved “${page.title}” ${delta < 0 ? "up" : "down"}.`
    );
  }

  async function remove(page) {
    if (!window.confirm(`Delete “${page.title}”? Its history is kept, but the page leaves the site.`)) return;

    setBusyId(page._id);
    setError(null);
    setNotice(null);
    try {
      await deletePage(page._id);
      setNotice(`Deleted “${page.title}”.`);
    } catch (err) {
      // The server refuses the first time if other pages link here, so the
      // admin sees exactly what would break before confirming.
      const proceed =
        /link to/.test(err.message) &&
        window.confirm(`${err.message}

Their links will 404 until someone fixes them.`);
      if (!proceed) {
        setError(err.message);
        setBusyId(null);
        return;
      }
      try {
        await deletePage(page._id, true);
        setNotice(`Deleted “${page.title}”. Remember to fix the links that pointed at it.`);
      } catch (err2) {
        setError(err2.message);
      }
    }
    await load();
    await refreshNav();
    setBusyId(null);
  }

  // --- Structure view -----------------------------------------------------

  function structureRow(page, index, total, isChild) {
    const busy = busyId === page._id;
    return (
      <div className={`prow${isChild ? " prow--child" : ""}${flashId === page._id ? " prow--flash" : ""}`} key={page._id}>
        <span className="prow-pos">{index + 1}</span>
        <div className="prow-main">
          <Link to={`/${page.slug}`} className="prow-title">
            {page.title}
          </Link>
          <span className="prow-slug">/{page.slug}</span>
        </div>
        <div className="prow-tags">
          {page.roadmapStage && <span className="page-badge">{page.roadmapStage}</span>}
          {page.hidden && <span className="page-badge page-badge--off">hidden</span>}
        </div>
        <div className="prow-actions">
          <button type="button" className="iconbtn" disabled={busy || index === 0} onClick={() => move(page, -1, "order")} title="Move up">
            ↑
          </button>
          <button type="button" className="iconbtn" disabled={busy || index === total - 1} onClick={() => move(page, 1, "order")} title="Move down">
            ↓
          </button>
          <button
            type="button"
            className="iconbtn"
            disabled={busy}
            onClick={() => run(page._id, () => updatePageMeta(page._id, { hidden: !page.hidden }), `${page.hidden ? "Shown" : "Hidden"}: “${page.title}”.`)}
            title={page.hidden ? "Show in nav" : "Hide from nav"}
          >
            {page.hidden ? "Show" : "Hide"}
          </button>
          <button type="button" className="iconbtn iconbtn--danger" disabled={busy} onClick={() => remove(page)} title="Delete page">
            ✕
          </button>
        </div>
      </div>
    );
  }

  // --- Roadmap view -------------------------------------------------------

  function roadmapRow(page, index, total) {
    const busy = busyId === page._id;
    return (
      <div className={`prow${flashId === page._id ? " prow--flash" : ""}`} key={page._id}>
        <span className="prow-pos">{index + 1}</span>
        <div className="prow-main">
          <Link to={`/${page.slug}`} className="prow-title">
            {page.title}
          </Link>
          <span className="prow-slug">{page.roadmapDesc || <em>no roadmap description</em>}</span>
        </div>
        <div className="prow-actions">
          <button type="button" className="iconbtn" disabled={busy || index === 0} onClick={() => move(page, -1, "roadmapOrder")} title="Earlier in the path">
            ↑
          </button>
          <button type="button" className="iconbtn" disabled={busy || index === total - 1} onClick={() => move(page, 1, "roadmapOrder")} title="Later in the path">
            ↓
          </button>
          <button
            type="button"
            className="iconbtn"
            disabled={busy}
            onClick={() => run(page._id, () => updatePageMeta(page._id, { roadmapStage: "" }), `Removed “${page.title}” from the roadmap.`)}
            title="Remove from roadmap"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <TopNav />
      <div className="editor-wrap">
        <h1>Pages</h1>
        <AdminNav />

        <form className="page-create" onSubmit={handleCreate}>
          <div className="page-create-row">
            <input
              type="text"
              placeholder="New page title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} aria-label="Parent section">
              <option value="">Top level (new section)</option>
              {sections.map((s) => (
                <option key={s._id} value={s.slug}>
                  Inside {s.title}
                </option>
              ))}
            </select>
            <select value={form.roadmapStage} onChange={(e) => setForm({ ...form, roadmapStage: e.target.value })} aria-label="Roadmap stage">
              <option value="">Not on roadmap</option>
              {stages.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.title}
                </option>
              ))}
            </select>
            <button type="submit" className="editor-btn" disabled={creating}>
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
        </form>

        <div className="editor-tabs">
          <button type="button" className={view === "structure" ? "active" : ""} onClick={() => setView("structure")}>
            Navigation
          </button>
          <button type="button" className={view === "roadmap" ? "active" : ""} onClick={() => setView("roadmap")}>
            Roadmap order
          </button>
        </div>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        {notice && <p className="admin-notice">{notice}</p>}

        {!pages && !error && <p className="md-status">Loading…</p>}

        {pages && view === "structure" && (
          <>
            <p className="editor-note">
              The order below is the order of the top navigation and each section's sidebar.
            </p>
            {sections.map((section, si) => {
              const kids = childrenOf(section.slug);
              return (
                <div className="pgroup" key={section._id}>
                  <div className="pgroup-head">
                    {structureRow(section, si, sections.length, false)}
                  </div>
                  {kids.length > 0 && (
                    <div className="pgroup-body">
                      {kids.map((kid, i) => structureRow(kid, i, kids.length, true))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {pages && view === "roadmap" && (
          <>
            <p className="editor-note">
              The order within each stage is the order members work through the roadmap.
            </p>
            {stages.map((stage) => {
              const topics = topicsIn(stage.key);
              return (
                <div className={`pgroup pgroup--${stage.levelClass}`} key={stage.key}>
                  <div className="pgroup-stage">
                    <span className="tree-stage-badge">{stage.label}</span>
                    <strong>{stage.title}</strong>
                    <span className="pgroup-count">
                      {topics.length} topic{topics.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="pgroup-body">
                    {topics.length === 0 && <p className="md-status pgroup-empty">No topics in this stage yet.</p>}
                    {topics.map((t, i) => roadmapRow(t, i, topics.length))}
                  </div>
                </div>
              );
            })}

            <div className="pgroup">
              <div className="pgroup-stage">
                <strong>Not on the roadmap</strong>
                <span className="pgroup-count">{offRoadmap.length} pages</span>
              </div>
              <div className="pgroup-body">
                {offRoadmap.map((page) => (
                  <div className={`prow${flashId === page._id ? " prow--flash" : ""}`} key={page._id}>
                    <div className="prow-main">
                      <Link to={`/${page.slug}`} className="prow-title">
                        {page.title}
                      </Link>
                      <span className="prow-slug">/{page.slug}</span>
                    </div>
                    <div className="prow-actions">
                      <select
                        value=""
                        disabled={busyId === page._id}
                        onChange={(e) =>
                          e.target.value &&
                          run(
                            page._id,
                            () => updatePageMeta(page._id, { roadmapStage: e.target.value }),
                            `Added “${page.title}” to the end of that stage.`
                          )
                        }
                        aria-label={`Add ${page.title} to a roadmap stage`}
                      >
                        <option value="">Add to stage…</option>
                        {stages.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
