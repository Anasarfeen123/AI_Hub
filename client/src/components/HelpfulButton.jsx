import { useState } from "react";
import { usePageContext } from "../context/PageContext";

// "👍 12" beside a resource link. Lets the best course or video surface
// without anyone rewriting the page.
export default function HelpfulButton({ url }) {
  const page = usePageContext();
  const [busy, setBusy] = useState(false);
  const r = page.ratings[url] || { count: 0, mine: false };

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      await page.rate(url, !r.mine);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`helpful${r.mine ? " is-mine" : ""}`}
      onClick={toggle}
      aria-pressed={r.mine}
      title={r.mine ? "You found this helpful — click to undo" : "Mark this resource as helpful"}
    >
      <span aria-hidden="true">👍</span>
      {r.count > 0 && <span className="helpful-count">{r.count}</span>}
      <span className="sr-only">{r.mine ? "Helpful (marked)" : "Mark as helpful"}</span>
    </button>
  );
}
