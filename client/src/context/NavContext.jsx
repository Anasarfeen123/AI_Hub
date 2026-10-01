import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { fetchNav } from "../api";
import { useAuth } from "./AuthContext";

// The nav tree now comes from the database, so it's fetched once here and
// shared rather than re-requested by every component that needs it.
const NavContext = createContext({ nav: [], loading: true, refresh: () => {} });

export function NavProvider({ children }) {
  const { user } = useAuth();
  const [nav, setNav] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setNav(await fetchNav());
    } catch {
      setNav([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Only fetched once someone is signed in — asking while signed out just
  // earns a 401 on the landing page.
  const email = user?.email;
  useEffect(() => {
    if (!email) return undefined;
    let cancelled = false;
    fetchNav()
      .catch(() => [])
      .then((n) => {
        if (cancelled) return;
        setNav(n);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [email]);

  return <NavContext.Provider value={{ nav, loading, refresh }}>{children}</NavContext.Provider>;
}

export function useNav() {
  return useContext(NavContext);
}
