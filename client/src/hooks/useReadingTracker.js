import { useEffect } from "react";
import { recordReading } from "../api";

function scrollFraction() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
}

// Records that the member opened this page (once), then — at most every 15
// seconds while they scroll, and when they leave — how far down they are.
// That powers "continue where you left off" and the admin page analytics.
export default function useReadingTracker(slug, ready) {
  useEffect(() => {
    if (!ready) return undefined;
    recordReading(slug, null, true);

    let last = 0;
    let lastSent = -1;
    const send = () => {
      const f = Math.round(scrollFraction() * 100) / 100;
      if (Math.abs(f - lastSent) < 0.02) return;
      lastSent = f;
      recordReading(slug, f);
    };
    const onScroll = () => {
      const now = Date.now();
      if (now - last > 15000) {
        last = now;
        send();
      }
    };
    const onHide = () => document.visibilityState === "hidden" && send();

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onHide);
    return () => {
      send();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [slug, ready]);
}
