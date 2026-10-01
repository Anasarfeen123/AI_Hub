import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StaffPage from "../components/StaffPage";
import { fetchAnalytics } from "../api";

const RANGES = [7, 30, 90];

function shortDate(day) {
  return new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

// Readers per day as a column chart. One series, so no legend: the heading
// names it. Each column carries its own tooltip and the same numbers are
// available as a table.
function DailyChart({ daily }) {
  const max = Math.max(1, ...daily.map((d) => d.readers));
  const labelEvery = daily.length > 31 ? 14 : daily.length > 8 ? 7 : 1;
  const last = daily.length - 1;
  // Label every Nth day plus the last one, unless the last would sit right
  // against the previous label.
  const showLabel = (i) => (i === last ? last % labelEvery >= labelEvery / 2 || labelEvery === 1 : i % labelEvery === 0);
  return (
    <figure className="chart">
      <div className="chart-plot" role="img" aria-label={`Readers per day over the last ${daily.length} days, peaking at ${max}`}>
        <span className="chart-max">{max}</span>
        <div className="chart-cols">
          {daily.map((d) => (
            <span
              key={d.day}
              className={`chart-col${d.readers ? "" : " is-zero"}`}
              style={{ height: `${(d.readers / max) * 100}%` }}
              data-tip={`${shortDate(d.day)}: ${d.readers} reader${d.readers === 1 ? "" : "s"} · ${d.views} view${d.views === 1 ? "" : "s"}`}
              tabIndex={0}
            />
          ))}
        </div>
        <div className="chart-axis">
          {daily.map((d, i) => (
            <span key={d.day}>{showLabel(i) ? shortDate(d.day) : ""}</span>
          ))}
        </div>
      </div>
      <details className="chart-table">
        <summary>Show as a table</summary>
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Readers</th>
              <th>Views</th>
            </tr>
          </thead>
          <tbody>
            {daily.map((d) => (
              <tr key={d.day}>
                <td>{shortDate(d.day)}</td>
                <td>{d.readers}</td>
                <td>{d.views}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

// Horizontal bars, longest first. Value labels sit in text colour beside the bar.
function BarList({ rows, value, label }) {
  const max = Math.max(1, ...rows.map(value));
  return (
    <ul className="barlist">
      {rows.map((r) => (
        <li key={r.slug} title={label(r)}>
          <Link to={`/${r.slug}`} className="barlist-label">
            {r.title}
          </Link>
          <span className="barlist-track">
            <span className="barlist-bar" style={{ width: `${(value(r) / max) * 100}%` }} />
          </span>
          <span className="barlist-value">{value(r)}</span>
        </li>
      ))}
    </ul>
  );
}

// The roadmap in order: how many members opened each topic and how many
// ticked it done. Two series, so a legend plus a number on every bar.
function Funnel({ funnel, members }) {
  const max = Math.max(1, members, ...funnel.flatMap((s) => s.topics.flatMap((t) => [t.read, t.done])));
  return (
    <div className="funnel">
      <div className="chart-legend" aria-hidden="true">
        <span>
          <i className="swatch swatch--read" /> Opened the page
        </span>
        <span>
          <i className="swatch swatch--done" /> Ticked it done
        </span>
      </div>
      {funnel.map((s) => (
        <div key={s.stage} className="funnel-stage">
          <p className="funnel-stage-title">{s.stage}</p>
          {s.topics.map((t) => (
            <div key={t.slug} className="funnel-row" title={`${t.title}: ${t.read} opened, ${t.done} done`}>
              <Link to={`/${t.slug}`} className="funnel-label">
                {t.title}
              </Link>
              <div className="funnel-bars">
                <span className="funnel-bar">
                  <span className={`funnel-fill funnel-fill--read${t.read ? "" : " is-zero"}`} style={{ width: `${(t.read / max) * 100}%` }} />
                  <span className="funnel-num">{t.read} opened</span>
                </span>
                <span className="funnel-bar">
                  <span className={`funnel-fill funnel-fill--done${t.done ? "" : " is-zero"}`} style={{ width: `${(t.done / max) * 100}%` }} />
                  <span className="funnel-num">{t.done} done</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState({ days: null, value: null });
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchAnalytics(days)
      .then((d) => !cancelled && setData({ days, value: d }))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [days]);

  const a = data.days === days ? data.value : null;

  return (
    <StaffPage title="Analytics" wide intro="Which pages get read, by how many people, and where along the roadmap members stop.">
      <div className="member-views" role="tablist" aria-label="Time range">
        {RANGES.map((r) => (
          <button key={r} type="button" role="tab" aria-selected={days === r} className={days === r ? "active" : ""} onClick={() => setDays(r)}>
            Last {r} days
          </button>
        ))}
      </div>
      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}
      {!a && !error && <p className="md-status">Loading…</p>}

      {a && (
        <>
          <div className="ov-tiles">
            <div className="ov-tile">
              <span className="ov-tile-label">Readers</span>
              <strong className="ov-tile-value">{a.totals.readers}</strong>
              <span className="ov-tile-sub">
                of {a.totals.activeMembers} members ({a.totals.activeMembers ? Math.round((a.totals.readers / a.totals.activeMembers) * 100) : 0}%)
              </span>
            </div>
            <div className="ov-tile">
              <span className="ov-tile-label">Page views</span>
              <strong className="ov-tile-value">{a.totals.views}</strong>
              <span className="ov-tile-sub">in the last {a.days} days</span>
            </div>
            <div className="ov-tile">
              <span className="ov-tile-label">Pages read</span>
              <strong className="ov-tile-value">{a.topPages.length}</strong>
              <span className="ov-tile-sub">{a.unread.length} not opened at all</span>
            </div>
          </div>

          <section className="ov-card">
            <div className="ov-card-head">
              <h2>Readers per day</h2>
            </div>
            <DailyChart daily={a.daily} />
          </section>

          <div className="ov-grid">
            <section className="ov-card">
              <div className="ov-card-head">
                <h2>Most read</h2>
                <span className="ov-card-hint">unique readers</span>
              </div>
              {a.topPages.length ? (
                <BarList rows={a.topPages} value={(r) => r.readers} label={(r) => `${r.title}: ${r.readers} readers, ${r.views} views`} />
              ) : (
                <p className="md-status">No page views recorded yet.</p>
              )}
            </section>
            <section className="ov-card">
              <div className="ov-card-head">
                <h2>Not opened</h2>
                <span className="ov-card-hint">in this period</span>
              </div>
              {a.unread.length ? (
                <ul className="ov-pages">
                  {a.unread.slice(0, 15).map((p) => (
                    <li key={p.slug}>
                      <Link to={`/${p.slug}`}>{p.title}</Link>
                    </li>
                  ))}
                  {a.unread.length > 15 && <li className="md-status">…and {a.unread.length - 15} more</li>}
                </ul>
              ) : (
                <p className="md-status">Every page was opened at least once. 🎉</p>
              )}
            </section>
          </div>

          <section className="ov-card">
            <div className="ov-card-head">
              <h2>Roadmap funnel</h2>
              <span className="ov-card-hint">all time · where the bars drop is where people get stuck</span>
            </div>
            <Funnel funnel={a.funnel} members={a.totals.activeMembers} />
          </section>
        </>
      )}
    </StaffPage>
  );
}
