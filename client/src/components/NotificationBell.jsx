import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchNotifications, fetchUnreadCount, markNotificationsRead } from "../api";
import { relativeTime } from "../lib/format";

const ICON = { reply: "💬", "page-updated": "📝", announcement: "📣", suggestion: "✏️", access: "🙋", flag: "🚩" };

// The bell in the header. Polls a cheap unread count once a minute while the
// tab is visible, and loads the list only when opened.
export default function NotificationBell() {
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const root = useRef(null);

  const poll = useCallback(() => {
    if (document.visibilityState !== "visible") return;
    fetchUnreadCount()
      .then(setUnread)
      .catch(() => {});
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 60000);
    document.addEventListener("visibilitychange", poll);
    // "n" opens the bell from the keyboard (see the shortcuts help).
    const onKey = () => setOpen(true);
    window.addEventListener("aihub:open-notifications", onKey);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", poll);
      window.removeEventListener("aihub:open-notifications", onKey);
    };
  }, [poll]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    fetchNotifications()
      .then((d) => {
        if (cancelled) return;
        setItems(d.items);
        setUnread(d.unread);
      })
      .catch(() => !cancelled && setItems([]));
    const onDown = (e) => root.current && !root.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      cancelled = true;
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function openItem(n) {
    setOpen(false);
    if (!n.read) {
      setUnread((u) => Math.max(0, u - 1));
      markNotificationsRead(n._id).catch(() => {});
    }
    if (n.link) navigate(n.link);
  }

  async function readAll() {
    setItems((list) => list?.map((n) => ({ ...n, read: true })));
    setUnread(0);
    await markNotificationsRead().catch(() => {});
  }

  return (
    <div className="bell" ref={root}>
      <button
        type="button"
        className="bell-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        title="Notifications"
      >
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && <span className="bell-count">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="bell-panel" role="dialog" aria-label="Notifications">
          <div className="bell-head">
            <strong>Notifications</strong>
            {unread > 0 && (
              <button type="button" className="link-btn" onClick={readAll}>
                Mark all read
              </button>
            )}
          </div>
          {items === null && <p className="bell-empty">Loading…</p>}
          {items?.length === 0 && (
            <p className="bell-empty">
              You're all caught up. Replies to your comments, updates to pages you saved and announcements show up here.
            </p>
          )}
          {items?.length > 0 && (
            <ul className="bell-list">
              {items.map((n) => (
                <li key={n._id}>
                  <button type="button" className={`bell-item${n.read ? "" : " is-unread"}`} onClick={() => openItem(n)}>
                    <span className="bell-icon" aria-hidden="true">
                      {ICON[n.type] || "🔔"}
                    </span>
                    <span className="bell-text">
                      {n.text}
                      <time dateTime={n.createdAt}>{relativeTime(n.createdAt)}</time>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
