import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Markdown from "../components/Markdown";
import Header from "../components/Header";
import { fetchPage, savePage } from "../api";
import { useNav } from "../context/NavContext";

export default function EditPage() {
  const { "*": slug } = useParams();
  const navigate = useNavigate();

  const [page, setPage] = useState(null);
  const [body, setBody] = useState("");
  const [summary, setSummary] = useState("");
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState({ loading: true, error: null, submitting: false });
  const { nav } = useNav();
  const textareaRef = useRef(null);

  // Flattens the nav so every page can be offered as a link target.
  const linkTargets = nav.flatMap((s) => [
    { title: s.title, path: s.path },
    ...(s.children || []).map((c) => ({ title: `${s.title} → ${c.title}`, path: c.path })),
  ]);

  // Inserts a Markdown link at the cursor. Absolute paths are used rather
  // than relative ../ ones so the link keeps working if the page is later
  // moved to a different section.
  function insertLink(path, title) {
    const el = textareaRef.current;
    const snippet = `[${title}](/${path})`;
    if (!el) {
      setBody((b) => b + snippet);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = body.slice(start, end);
    const text = selected ? `[${selected}](/${path})` : snippet;
    setBody(body.slice(0, start) + text + body.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    });
  }

  useEffect(() => {
    fetchPage(slug)
      .then((p) => {
        setPage(p);
        setBody(p.body);
        setStatus({ loading: false, error: null, submitting: false });
      })
      .catch((err) => setStatus({ loading: false, error: err.message, submitting: false }));
  }, [slug]);

  const dirty = page && body !== page.body;

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus((s) => ({ ...s, submitting: true, error: null }));
    try {
      await savePage(slug, body, summary);
      navigate(`/${slug}`);
    } catch (err) {
      setStatus((s) => ({ ...s, submitting: false, error: err.message }));
    }
  }

  if (status.loading) {
    return (
      <>
        <Header />
        <div className="editor-wrap">
          <p className="md-status">Loading…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="editor-wrap">
        <div className="editor-head">
          <div>
            <p className="editor-eyebrow">Editing</p>
            <h1>{page?.title || slug}</h1>
          </div>
          <Link className="editor-cancel" to={`/${slug}`}>
            Cancel
          </Link>
        </div>

        <p className="editor-note">
          Your changes go live as soon as you save. Every save is recorded, so a lead can
          restore an earlier version if something goes wrong. Write in Markdown — headings with{" "}
          <code>##</code>, links as <code>[text](url)</code>. To link another hub page, use
          “Link to a page” — or write the path yourself, like{" "}
          <code>[CNNs](/deep-learning/cnn)</code>.
        </p>

        {status.error && (
          <p className="login-error" role="alert">
            {status.error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="editor-tabs">
            <button type="button" className={!preview ? "active" : ""} onClick={() => setPreview(false)}>
              Write
            </button>
            <button type="button" className={preview ? "active" : ""} onClick={() => setPreview(true)}>
              Preview
            </button>

            {!preview && (
              <select
                className="editor-linkpicker"
                value=""
                onChange={(e) => {
                  const t = linkTargets.find((x) => x.path === e.target.value);
                  if (t) insertLink(t.path, t.title.split(" → ").pop());
                  e.target.value = "";
                }}
                aria-label="Insert a link to another page"
              >
                <option value="">🔗 Link to a page…</option>
                {linkTargets.map((t) => (
                  <option key={t.path} value={t.path}>
                    {t.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {preview ? (
            <div className="editor-preview md-content">
              <Markdown body={body} linkBase={page?.linkBase} />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              className="editor-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              spellCheck="false"
            />
          )}

          <label className="editor-summary">
            <span>What did you change? (optional, shows up in the page history)</span>
            <input
              type="text"
              value={summary}
              maxLength={300}
              placeholder="e.g. Added a link to the Stanford CS231n lectures"
              onChange={(e) => setSummary(e.target.value)}
            />
          </label>

          <div className="editor-actions">
            <button type="submit" className="editor-btn" disabled={!dirty || status.submitting}>
              {status.submitting ? "Saving…" : "Save changes"}
            </button>
            {!dirty && <span className="md-status">Make a change to save.</span>}
          </div>
        </form>
      </div>
    </>
  );
}
