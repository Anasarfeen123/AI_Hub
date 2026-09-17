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
  const [resolved, setResolved] = useState(() =>
    readStored() === "system" ? (systemPrefersDark() ? "dark" : "light") : readStored()
  );

  // Stamp the root element so CSS can select on it, and keep `color-scheme` in
  // step so form controls and scrollbars match.
  useEffect(() => {
    const effective = mode === "system" ? (systemPrefersDark() ? "dark" : "light") : mode;
    setResolved(effective);

    const root = document.documentElement;
    root.setAttribute("data-theme", effective);
    root.style.colorScheme = effective;

    try {
      if (mode === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Storage is a convenience here; the theme still applies without it.
    }
  }, [mode]);

  // Follow the OS live, but only while the member hasn't chosen for themselves.
  useEffect(() => {
    if (mode !== "system") return undefined;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const effective = mq.matches ? "dark" : "light";
      setResolved(effective);
      document.documentElement.setAttribute("data-theme", effective);
      document.documentElement.style.colorScheme = effective;
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
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
