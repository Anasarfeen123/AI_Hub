import { createContext, useCallback, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "aihub-theme";

// Three states, not two. "system" follows the OS and is the default, so someone
// who has their laptop on night mode gets the dark hub without touching
// anything; picking light or dark stores an explicit override.
const MODES = ["system", "light", "dark"];

function readStored() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return MODES.includes(v) ? v : "system";
  } catch {
    // Private browsing and blocked site data both throw here.
    return "system";
  }
}

function systemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(readStored);
  // Tracked separately so "system" can follow the OS live; the effective
  // theme is then derived during render rather than mirrored into state.
  const [systemDark, setSystemDark] = useState(systemPrefersDark);
  const resolved = mode === "system" ? (systemDark ? "dark" : "light") : mode;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Stamp the root element so CSS can select on it, and keep `color-scheme` in
  // step so form controls and scrollbars match.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", resolved);
    root.style.colorScheme = resolved;
  }, [resolved]);

  useEffect(() => {
    try {
      if (mode === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Storage is a convenience here; the theme still applies without it.
    }
  }, [mode]);

  // The toggle walks light -> dark -> system, so "follow my OS" stays reachable
  // without a separate menu.
  const cycle = useCallback(() => {
    setMode((m) => MODES[(MODES.indexOf(m) + 1) % MODES.length]);
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode, cycle }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
