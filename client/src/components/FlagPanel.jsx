import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchFlags, raiseFlag, resolveFlag } from "../api";
import { useAuth } from "../context/AuthContext";
import { isStaff } from "../lib/roles";
import { relativeTime } from "../lib/format";

const KINDS = [
  ["outdated", "Out of date"],
  ["incomplete", "Missing something"],
  ["broken-link", "Broken link"],
  ["unclear", "Hard to follow"],
  ["other", "Something else"],
];
const LABEL = Object.fromEntries(KINDS);

// "This page needs help": anyone can flag a page, and open flags show here so
// the next editor knows what to fix. They also feed the Help wanted list.
export default function FlagPanel({ slug }) {
  const { user } = useAuth();
  const [flags, setFlags] = useState([]);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("outdated");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchFlags(slug)
      .then((f) => !cancelled && setFlags(f))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await raiseFlag(slug, kind, note);
      setFlags(await fetchFlags(slug));
      setOpen(false);
      setNote("");
      setMsg("Thanks — it's on the Help wanted list now.");
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function resolve(id) {
    try {
      await resolveFlag(id);
      setFlags((f) => f.filter((x) => x._id !== id));
    } catch (err) {
      setMsg(err.message);
    }
  }

  const staff = isStaff(user?.role);

  return (
    <div className="flag-panel">
      {flags.length > 0 && (
        <div className="flag-list" role="status">
          <strong>
            {flags.length === 1 ? "1 open note" : `${flags.length} open notes`} on this page — help fix them?
          </strong>
          <ul>
            {flags.map((f) => (
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
        </div>
      )}

      {!open ? (
        <p className="flag-cta">
          Something wrong or missing here?{" "}
          <button type="button" className="link-btn" onClick={() => setOpen(true)}>
            Flag this page
          </button>
          {" "}or{" "}
          <Link to={`/edit/${slug}`}>fix it yourself</Link>.
          {msg && <span className="flag-msg"> {msg}</span>}
        </p>
      ) : (
        <form className="flag-form" onSubmit={submit}>
          <div className="flag-kinds" role="radiogroup" aria-label="What's wrong?">
            {KINDS.map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                className={kind === k ? "active" : ""}
                onClick={() => setKind(k)}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="Optional: what exactly? e.g. “The PyTorch link 404s”"
            aria-label="Details"
          />
          <div className="flag-form-actions">
            <button type="button" className="btn btn--sm" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary btn--sm" disabled={busy}>
              {busy ? "Sending…" : "Flag page"}
            </button>
          </div>
          {msg && <p className="comment-error">{msg}</p>}
        </form>
      )}
    </div>
  );
}
