import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { fetchMe, logout as apiLogout } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const u = await fetchMe().catch(() => null);
    setUser(u);
    setLoading(false);
  }, []);

  // Loading starts true, so the first check doesn't need to set it.
  useEffect(() => {
    let cancelled = false;
    fetchMe()
      .catch(() => null)
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = async () => {
    await apiLogout();
    // Offline copies of members-only pages shouldn't outlive the session,
    // especially on a shared computer.
    try {
      navigator.serviceWorker?.controller?.postMessage("clear-data");
      await window.caches?.delete("aihub-data");
    } catch {
      // No service worker or cache support: nothing was stored.
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
