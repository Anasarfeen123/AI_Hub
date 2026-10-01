import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import StaffPage from "../components/StaffPage";
import { fetchLinkReport, startLinkCheck } from "../api";
import { relativeTime } from "../lib/format";

// Every external link in the hub, checked in the background. Broken ones are
// dead (404, or the domain no longer exists); "check by hand" ones refused a
// bot or timed out, which is often fine but worth a look.
export default function LinksPage() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const timer = useRef(null);
  const poll = useRef(() => {});

  // Fetch the report, and keep re-fetching every 2s while a check runs.
  useEffect(() => {
    let stopped = false;
    async function tick() {
      try {
        const r = await fetchLinkReport();
        if (stopped) return;
        setReport(r);
        clearTimeout(timer.current);
        if (r.job.running) timer.current = setTimeout(tick, 2000);
      } catch (err) {
        if (!stopped) setError(err.message);
      }
    }
    poll.current = tick;
    tick();
    return () => {
      stopped = true;
      clearTimeout(timer.current);
    };
  }, []);

  async function run() {
    setError(null);
    try {
      await startLinkCheck();
      poll.current();
    } catch (err) {
      setError(err.message);
    }
  }

  const broken = report?.results.filter((r) => r.state === "broken") || [];
  const unknown = report?.results.filter((r) => r.state === "unknown") || [];
  const job = report?.job;

  const Row = ({ r }) => (
    <li className="link-row">
      <a href={r.url} target="_blank" rel="noreferrer" className="link-url">
        {r.url}
      </a>
      <span className="link-why">{r.status ? `HTTP ${r.status}` : r.error || "No response"}</span>
      <span className="link-pages">
        on{" "}
        {r.pages.map((p, i) => (
          <span key={p.slug}>
            {i > 0 && ", "}
            <Link to={`/edit/${p.slug}`}>{p.title}</Link>
          </span>
        ))}
      </span>
    </li>
  );

  return (
    <StaffPage title="Link checker" intro="Finds dead resource links across every page, so members don't hit 404s. It also runs every week on its own once the scheduled job is set up.">
      <div className="links-bar">
        <button type="button" className="btn btn--primary" onClick={run} disabled={job?.running}>
          {job?.running ? "Checking…" : "Check all links now"}
        </button>
        {job?.running && (
          <span className="md-status">
            {job.checked} of {job.total || "…"} checked
          </span>
        )}
        {!job?.running && report?.lastChecked && (
          <span className="md-status">
            Last checked {relativeTime(report.lastChecked)} · {report.ok} working
          </span>
        )}
      </div>
      {job?.running && job.total > 0 && (
        <div className="links-progress" role="progressbar" aria-valuenow={job.checked} aria-valuemin={0} aria-valuemax={job.total}>
          <span style={{ width: `${(job.checked / job.total) * 100}%` }} />
        </div>
      )}
      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}
      {!report && !error && <p className="md-status">Loading…</p>}

      {report && !report.lastChecked && !job?.running && (
        <div className="empty-state empty-state--boxed">
          <p>
            <strong>No check has run yet.</strong>
          </p>
          <p className="md-status">It takes about a minute for the whole hub.</p>
        </div>
      )}

      {report?.lastChecked && (
        <>
          <section className="ov-card">
            <div className="ov-card-head">
              <h2>Broken ({broken.length})</h2>
              <span className="ov-card-hint">click a page name to fix it</span>
            </div>
            {broken.length ? <ul className="link-list">{broken.map((r) => <Row key={r.url} r={r} />)}</ul> : <p className="md-status">No broken links. 🎉</p>}
          </section>
          <section className="ov-card">
            <div className="ov-card-head">
              <h2>Check by hand ({unknown.length})</h2>
              <span className="ov-card-hint">the site blocked our checker or was slow — usually fine</span>
            </div>
            {unknown.length ? <ul className="link-list">{unknown.map((r) => <Row key={r.url} r={r} />)}</ul> : <p className="md-status">Nothing to check.</p>}
          </section>
        </>
      )}
    </StaffPage>
  );
}
