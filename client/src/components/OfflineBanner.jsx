import { useEffect, useState } from "react";

// A quiet strip when the connection drops, so a failed save or a missing page
// has an obvious explanation. Pages you've opened before still load.
export default function OfflineBanner() {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  if (online) return null;
  return (
    <div className="offline-banner" role="status">
      You're offline — showing pages you've opened before. Changes can't be saved until you're back online.
    </div>
  );
}
