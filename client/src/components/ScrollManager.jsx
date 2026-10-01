import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// A single-page app keeps the scroll position between routes, so opening a
// page from the bottom of another landed you halfway down it. New pages now
// start at the top; back/forward keeps the browser's own restoration, and a
// #hash is handled by the page once its content has loaded.
export default function ScrollManager() {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (navType === "POP" || hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash, navType]);

  return null;
}
