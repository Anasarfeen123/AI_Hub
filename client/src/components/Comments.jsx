import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "../context/AuthContext";
import { fetchComments, postComment, editComment, deleteComment } from "../api";
import { isStaff } from "../lib/roles";
import { initials, relativeTime } from "../lib/format";
import RoleBadge from "./RoleBadge";

const MAX = 5000;

// Comments accept a small, safe subset of Markdown — enough for a link, some
// code and a list, without headings or images breaking up the thread.
const ALLOWED = ["p", "a", "strong", "em", "del", "code", "pre", "ul", "ol", "li", "blockquote", "br"];
const linkProps = { a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer nofollow">{children}</a> };

function CommentText({ body }) {
  return (
    <div className="comment-text">
      <ReactMarkdown remarkPlugins={[remarkGfm]} allowedElements={ALLOWED} unwrapDisallowed components={linkProps}>
        {body}
      </ReactMarkdown>
    </div>
  );
}

function Composer({ initial = "", submitLabel, onSubmit, onCancel, autoFocus, placeholder }) {
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e?.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(text);
      setText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="comment-composer" onSubmit={submit}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(e);
          if (e.key === "Escape" && onCancel) onCancel();
        }}
        placeholder={placeholder}
        maxLength={MAX}
        rows={3}
        autoFocus={autoFocus}
        aria-label={placeholder}
      />
      {error && (
        <p className="comment-error" role="alert">
          {error}
        </p>
      )}
      <div className="comment-composer-actions">
        <span className="comment-hint">
          Markdown works · <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to post
          {text.length > MAX - 500 && ` · ${MAX - text.length} left`}
        </span>
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn--primary" disabled={!text.trim() || busy}>
          {busy ? "Posting…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Comment({ comment, replies, user, onReply, onEdit, onDelete, isReply }) {
  const [mode, setMode] = useState(null); // "reply" | "edit"
  const mine = comment.authorEmail === user.email;
  const canDelete = mine || isStaff(user.role);

  if (comment.deleted) {
    return (
      <li className="comment comment--deleted">
        <p className="comment-removed">This comment was deleted.</p>
        {replies?.length > 0 && (
          <ul className="comment-replies">
            {replies.map((r) => (
              <Comment key={r._id} comment={r} user={user} onReply={onReply} onEdit={onEdit} onDelete={onDelete} isReply />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li className="comment" id={`comment-${comment._id}`}>
      <span className="comment-avatar" aria-hidden="true">
        {initials(comment.authorName)}
      </span>
      <div className="comment-main">
        <div className="comment-meta">
          <strong>{comment.authorName || comment.authorEmail}</strong>
          <RoleBadge role={comment.authorRole} />
          <time dateTime={comment.createdAt} title={new Date(comment.createdAt).toLocaleString()}>
            {relativeTime(comment.createdAt)}
          </time>
          {comment.editedAt && <span className="comment-edited">(edited)</span>}
        </div>

        {mode === "edit" ? (
          <Composer
            initial={comment.body}
            submitLabel="Save"
            autoFocus
            placeholder="Edit your comment"
            onCancel={() => setMode(null)}
            onSubmit={async (text) => {
              await onEdit(comment._id, text);
              setMode(null);
            }}
          />
        ) : (
          <CommentText body={comment.body} />
        )}

        {mode !== "edit" && (
          <div className="comment-actions">
            {!isReply && (
              <button type="button" onClick={() => setMode(mode === "reply" ? null : "reply")}>
                Reply
              </button>
            )}
            {mine && (
              <button type="button" onClick={() => setMode("edit")}>
                Edit
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className="is-danger"
                onClick={() => window.confirm("Delete this comment?") && onDelete(comment._id)}
              >
                Delete
              </button>
            )}
          </div>
        )}

        {replies?.length > 0 && (
          <ul className="comment-replies">
            {replies.map((r) => (
              <Comment key={r._id} comment={r} user={user} onReply={onReply} onEdit={onEdit} onDelete={onDelete} isReply />
            ))}
          </ul>
        )}

        {mode === "reply" && (
          <Composer
            submitLabel="Reply"
            autoFocus
            placeholder={`Reply to ${comment.authorName || "this comment"}`}
            onCancel={() => setMode(null)}
            onSubmit={async (text) => {
              await onReply(text, comment._id);
              setMode(null);
            }}
          />
        )}
      </div>
    </li>
  );
}

export default function Comments({ slug, onCountChange }) {
  const { user } = useAuth();
  const [comments, setComments] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchComments(slug)
      .then((c) => !cancelled && setComments(c))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const { top, repliesOf, count } = useMemo(() => {
    const list = comments || [];
    const repliesOf = new Map();
    for (const c of list) {
      if (c.parentId) repliesOf.set(c.parentId, [...(repliesOf.get(c.parentId) || []), c]);
    }
    return {
      top: list.filter((c) => !c.parentId),
      repliesOf,
      count: list.filter((c) => !c.deleted).length,
    };
  }, [comments]);

  useEffect(() => {
    if (comments) onCountChange?.(count);
  }, [comments, count, onCountChange]);

  // A notification links to "#comment-<id>"; comments load after the page, so
  // the browser can't jump there itself. Do it once they're in.
  const jumped = useRef(false);
  useEffect(() => {
    if (!comments || jumped.current) return;
    const hash = window.location.hash;
    if (!hash.startsWith("#comment-")) return;
    jumped.current = true;
    const el = document.getElementById(hash.slice(1));
    if (el) {
      el.scrollIntoView({ block: "center" });
      el.classList.add("is-highlighted");
      setTimeout(() => el.classList.remove("is-highlighted"), 2500);
    }
  }, [comments]);

  async function add(text, parentId = null) {
    const created = await postComment(slug, text, parentId);
    setComments((list) => [...(list || []), created]);
  }

  async function update(id, text) {
    const updated = await editComment(id, text);
    setComments((list) => list.map((c) => (c._id === id ? updated : c)));
  }

  async function remove(id) {
    try {
      await deleteComment(id);
      setComments((list) => list.map((c) => (c._id === id ? { _id: c._id, parentId: c.parentId, deleted: true, createdAt: c.createdAt } : c)));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="comments" id="discussion" aria-labelledby="discussion-title">
      <h2 id="discussion-title" className="comments-title">
        Discussion {count > 0 && <span className="comments-count">{count}</span>}
      </h2>
      <p className="comments-sub">
        Questions, better resources, or something that tripped you up — leave it here for the next person.
      </p>

      {error && (
        <p className="comment-error" role="alert">
          {error}
        </p>
      )}

      <Composer submitLabel="Comment" placeholder="Add to the discussion…" onSubmit={(t) => add(t)} />

      {!comments && !error && <p className="md-status">Loading comments…</p>}
      {comments && top.length === 0 && <p className="comments-empty">No comments yet — start the conversation.</p>}

      {top.length > 0 && (
        <ul className="comment-list">
          {top.map((c) => (
            <Comment
              key={c._id}
              comment={c}
              replies={repliesOf.get(c._id)}
              user={user}
              onReply={add}
              onEdit={update}
              onDelete={remove}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
