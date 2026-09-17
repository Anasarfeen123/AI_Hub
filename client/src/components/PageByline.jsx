import RoleBadge from "./RoleBadge";

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// "3 days ago" is easier to judge than a date when the question is really
// "is this current?". The exact timestamp stays in the tooltip.
function relativeTime(iso) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.round((Date.now() - then) / 1000);

  if (seconds < 45) return "just now";
  const units = [
    ["minute", 60],
    ["hour", 3600],
    ["day", 86400],
    ["week", 604800],
    ["month", 2629800],
    ["year", 31557600],
  ];

  let label = "year";
  let size = 31557600;
  for (let i = 0; i < units.length; i++) {
    const [name, secs] = units[i];
    const next = units[i + 1];
    if (!next || seconds < next[1]) {
      label = name;
      size = secs;
      break;
    }
  }
  const n = Math.max(1, Math.round(seconds / size));
  return `${n} ${label}${n === 1 ? "" : "s"} ago`;
}

export default function PageByline({ page }) {
  if (!page?.updatedAt) return null;

  // A page edited by someone who has since left the club still shows their
  // email, so the history never silently loses its author.
  const who = page.editorName || page.updatedBy;
  const when = new Date(page.updatedAt);

  return (
    <div className="page-byline">
      {who && <span className="page-byline-avatar" aria-hidden="true">{initials(page.editorName || "")}</span>}
      {who ? (
        <>
          <span>
            Last edited by <strong>{who}</strong>
          </span>
          <RoleBadge role={page.editorRole} />
          <span className="page-byline-sep" aria-hidden="true">·</span>
        </>
      ) : (
        <span>Last updated</span>
      )}
      <time dateTime={when.toISOString()} title={when.toLocaleString()}>
        {relativeTime(page.updatedAt)}
      </time>
    </div>
  );
}
