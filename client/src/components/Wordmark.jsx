// The hub's wordmark: a heavy, wide "AIML" (with the bar-less Λ-style A) and a
// thin, tracked "RESOURCE HUB". Drawn as paths rather than set in a font, so
// it matches the brand artwork exactly at every size and takes the current
// text colour — right in light and dark themes alike.
export default function Wordmark({ sub = true, className = "" }) {
  return (
    <span className={`wordmark ${className}`}>
      <svg className="wordmark-aiml" viewBox="0 0 478 100" aria-hidden="true" focusable="false">
        <path d="M0 100 55 0h13l55 100h-21L61.5 27 21 100Z" />
        <path d="M141 0h19v100h-19Z" />
        <path d="M180 100V0h19l58 64 58-64h19v100h-19V33l-58 64-58-64v67Z" />
        <path d="M354 0h19v81h105v19H370a16 16 0 0 1-16-16Z" />
      </svg>
      {sub && <span className="wordmark-sub">Resource Hub</span>}
      <span className="sr-only">AIML Resource Hub</span>
    </span>
  );
}
