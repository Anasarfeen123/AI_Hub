import RoleBadge from "./RoleBadge";
import { initials, relativeTime } from "../lib/format";

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
