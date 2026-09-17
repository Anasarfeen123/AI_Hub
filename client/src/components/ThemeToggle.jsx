import { useTheme } from "../context/ThemeContext";

// Sun / moon / monitor, matching the three states the toggle cycles through.
const ICONS = {
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  dark: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  system: (
    <>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
};

const LABEL = {
  light: "Light theme",
  dark: "Dark theme",
  system: "Matching your system theme",
};

export default function ThemeToggle() {
  const { mode, cycle } = useTheme();

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={cycle}
      // The title says what it IS; the aria-label says what clicking DOES, so
      // a screen reader announces the action rather than the current state.
      title={LABEL[mode]}
      aria-label={`${LABEL[mode]}. Switch theme.`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {ICONS[mode]}
      </svg>
    </button>
  );
}
