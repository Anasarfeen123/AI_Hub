import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Markdown from "../components/Markdown";
import Header from "../components/Header";
import { fetchPage, savePage, suggestEdit, uploadImage } from "../api";
import { useNav } from "../context/NavContext";
import useDocumentTitle from "../hooks/useDocumentTitle";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

// Write, Preview, or both side by side. Split only fits on a wide screen, so
// it isn't offered on phones (see .editor-tab--split in the CSS).
const MODES = [
  ["write", "Write"],
  ["split", "Split"],
  ["preview", "Preview"],
];

export default function EditPage() {
  const { "*": slug } = useParams();
  const navigate = useNavigate();

  const [page, setPage] = useState(null);
  const [body, setBody] = useState("");
  const [summary, setSummary] = useState("");
  const [mode, setMode] = useState("write");
  const [status, setStatus] = useState({ loading: true, error: null, submitting: false, conflict: false });
  const { nav } = useNav();
  const textareaRef = useRef(null);
  const fileRef = useRef(null);
  // "publish" goes live now; "review" sends it to an admin first, for anyone
  // who'd rather not change the live page directly.
  const [submitMode, setSubmitMode] = useState("publish");
  const [uploading, setUploading] = useState(0);
  const [done, setDone] = useState(null);
  const formRef = useRef(null);

  useDocumentTitle(page ? `Editing ${page.title}` : "Editing");

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
    let cancelled = false;
    fetchPage(slug)
      .then((p) => {
        if (cancelled) return;
        setPage(p);
        setBody(p.body);
        setStatus({ loading: false, error: null, submitting: false, conflict: false });
      })
      .catch((err) => !cancelled && setStatus({ loading: false, error: err.message, submitting: false, conflict: false }));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const dirty = Boolean(page) && body !== page.body;

  // Closing the tab or reloading with unsaved work asks first. (In-app links
  // go through `leave` below for the same reason.)
  useEffect(() => {
    if (!dirty || status.submitting) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, status.submitting]);

  function leave(e) {
    if (dirty && !window.confirm("Discard your unsaved changes?")) e.preventDefault();
  }

  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault();
      if (!dirty || status.submitting) return;
      setStatus((s) => ({ ...s, submitting: true, error: null, conflict: false }));
      try {
        if (submitMode === "review") {
          await suggestEdit(slug, body, summary, page.updatedAt);
          setPage((p) => ({ ...p, body }));
          setStatus((s) => ({ ...s, submitting: false }));
          setDone("review");
          return;
        }
        await savePage(slug, body, summary, page.updatedAt);
        // Mark clean first so the unsaved-changes guard doesn't fire on the way out.
        setPage((p) => ({ ...p, body }));
        navigate(`/${slug}`);
      } catch (err) {
        const conflict = /while you were editing/.test(err.message);
        setStatus((s) => ({ ...s, submitting: false, error: err.message, conflict }));
      }
    },
    [dirty, status.submitting, slug, body, summary, page, navigate, submitMode]
  );

  // Images: picked with the button, pasted, or dropped onto the editor. A
  // placeholder goes in at the cursor straight away and is swapped for the
  // real link once the upload finishes.
  async function addImages(files) {
    const images = [...files].filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    for (const file of images) {
      const token = `![Uploading ${file.name || "image"}…]()`;
      const el = textareaRef.current;
      const at = el ? el.selectionStart : body.length;
      setBody((b) => `${b.slice(0, at)}${token}\n${b.slice(at)}`);
      setUploading((n) => n + 1);
      try {
        const url = await uploadImage(file, slug);
        const alt = (file.name || "image").replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").slice(0, 80) || "image";
        setBody((b) => b.replace(token, `![${alt}](${url})`));
      } catch (err) {
        setBody((b) => b.replace(`${token}\n`, "").replace(token, ""));
        setStatus((st) => ({ ...st, error: err.message }));
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  function onPaste(e) {
    const files = e.clipboardData?.files;
    if (files?.length && [...files].some((f) => f.type.startsWith("image/"))) {
      e.preventDefault();
      addImages(files);
    }
  }

  function onDrop(e) {
    if (e.dataTransfer?.files?.length) {
      e.preventDefault();
      addImages(e.dataTransfer.files);
    }
  }

  // Ctrl/⌘+S saves instead of opening the browser's "Save page as".
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSubmit]);

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(body);
    } catch {
      textareaRef.current?.select();
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

  if (!page) {
    return (
      <>
        <Header />
        <main id="main" className="editor-wrap">
          <h1>Page not available</h1>
          <p className="md-status">{status.error}</p>
          <Link className="btn btn--ghost" to="/">
            Back to the homepage
          </Link>
        </main>
      </>
    );
  }

  if (done === "review") {
    return (
      <>
        <Header />
        <main id="main" className="editor-wrap">
          <div className="empty-state empty-state--boxed editor-sent">
            <p className="editor-sent-icon" aria-hidden="true">
              ✉️
            </p>
            <p>
              <strong>Sent for review — thank you!</strong>
            </p>
            <p className="md-status">
              An admin will look at your edit to “{page.title}”. You'll get a notification when it's approved or if they have
              feedback.
            </p>
            <div className="empty-state-actions">
              <Link className="btn btn--primary" to={`/${slug}`}>
                Back to the page
              </Link>
              <Link className="btn" to="/me">
                Your suggestions
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const showWrite = mode !== "preview";
  const showPreview = mode !== "write";

  return (
    <>
      <Header />
      <main id="main" className={`editor-wrap${mode === "split" ? " editor-wrap--split" : ""}`}>
        <div className="editor-head">
          <div>
            <p className="editor-eyebrow">Editing</p>
            <h1>{page.title || slug}</h1>
          </div>
          <Link className="editor-cancel" to={`/${slug}`} onClick={leave}>
            Cancel
          </Link>
        </div>

        <p className="editor-note">
          Changes go live as soon as you save, and every save is recorded so a lead can restore an
          earlier version. Write in Markdown — <code>##</code> for headings,{" "}
          <code>[text](url)</code> for links, or use “Link to a page” to point at another hub page.
        </p>

        {status.error && (
          <div className="login-error editor-error" role="alert">
            <p>{status.error}</p>
            {status.conflict && (
              <p className="editor-error-actions">
                <button type="button" className="btn btn--sm" onClick={copyDraft}>
                  Copy my text
                </button>
                <a className="btn btn--sm" href={`/edit/${slug}`}>
                  Reload the latest version
                </a>
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} ref={formRef}>
          <div className="editor-tabs" role="tablist" aria-label="Editor view">
            {MODES.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={mode === key}
                className={`${mode === key ? "active" : ""}${key === "split" ? " editor-tab--split" : ""}`}
                onClick={() => setMode(key)}
              >
                {label}
              </button>
            ))}

            {showWrite && (
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
            {showWrite && (
              <>
                <button
                  type="button"
                  className="editor-image-btn"
                  onClick={() => fileRef.current?.click()}
                  title="Add an image (or paste / drop one into the editor)"
                >
                  🖼 {uploading ? "Uploading…" : "Image"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  multiple
                  hidden
                  onChange={(e) => {
                    addImages(e.target.files);
                    e.target.value = "";
                  }}
                />
              </>
            )}
          </div>

          <div className="editor-panes">
            {showWrite && (
              <textarea
                ref={textareaRef}
                className="editor-textarea"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onPaste={onPaste}
                onDrop={onDrop}
                onDragOver={(e) => e.dataTransfer?.types?.includes("Files") && e.preventDefault()}
                spellCheck="false"
                aria-label="Page content (Markdown)"
              />
            )}
            {showPreview && (
              <div className="editor-preview md-content">
                <Markdown body={body} linkBase={page.linkBase} />
              </div>
            )}
          </div>

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

          <fieldset className="editor-mode">
            <legend className="sr-only">How should this change go out?</legend>
            <label className={submitMode === "publish" ? "active" : ""}>
              <input
                type="radio"
                name="submit-mode"
                checked={submitMode === "publish"}
                onChange={() => setSubmitMode("publish")}
              />
              <strong>Publish now</strong>
              <span>Goes live straight away. Every save is versioned.</span>
            </label>
            <label className={submitMode === "review" ? "active" : ""}>
              <input
                type="radio"
                name="submit-mode"
                checked={submitMode === "review"}
                onChange={() => setSubmitMode("review")}
              />
              <strong>Send for review</strong>
              <span>An admin checks it first. You'll get a notification either way.</span>
            </label>
          </fieldset>

          <div className="editor-actions">
            <button type="submit" className="editor-btn" disabled={!dirty || status.submitting || uploading > 0}>
              {status.submitting ? "Saving…" : submitMode === "review" ? "Send for review" : "Publish changes"}
            </button>
            <span className="md-status">
              {dirty ? (
                <>
                  Unsaved changes · <kbd>{isMac ? "⌘" : "Ctrl"}</kbd>+<kbd>S</kbd> to save
                </>
              ) : (
                "Make a change to save."
              )}
            </span>
          </div>
        </form>
      </main>
    </>
  );
}
