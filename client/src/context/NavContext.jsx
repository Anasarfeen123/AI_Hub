import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { fetchNav } from "../api";

// The nav tree now comes from the database, so it's fetched once here and
// shared rather than re-requested by every component that needs it.
const NavContext = createContext({ nav: [], loading: true, refresh: () => {} });

export function NavProvider({ children }) {
  const [nav, setNav] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setNav(await fetchNav());
    } catch {
      // Signed-out users get a 401 here; the login gate handles that, and an
      // empty nav is the right fallback either way.
      setNav([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <NavContext.Provider value={{ nav, loading, refresh }}>{children}</NavContext.Provider>;
}

export function useNav() {
  return useContext(NavContext);
}

// Finds a page and its parent section — used for sidebars and page titles.
export function findInNav(nav, path) {
  const clean = (path || "").replace(/^\/+|\/+$/g, "");
  for (const section of nav) {
    if (section.path === clean) return { section, page: section };
    for (const child of section.children || []) {
      if (child.path === clean) return { section, page: child };
    }
  }
  return null;
}
