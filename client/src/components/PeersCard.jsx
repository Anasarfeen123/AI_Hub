import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPeers, saveSettings } from "../api";
import { initials } from "../lib/format";

// "Learning alongside you": members who chose to share their progress,
// grouped by the stage they're on. Strictly opt-in.
export default function PeersCard() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    fetchPeers()
      .then(setData)
      .catch(() => setData(null));

  useEffect(() => {
    load();
  }, []);

  if (!data) return null;

  async function optIn() {
    setBusy(true);
    try {
      await saveSettings({ shareProgress: true });
      await load();
    } finally {
      setBusy(false);
    }
  }

  const mine = data.groups.find((g) => g.members.some((m) => m.you));
  const groups = data.groups.filter((g) => g.members.length);
  const others = (g) => g.members.filter((m) => !m.you);

  return (
    <section className="home-card">
      <div className="home-card-head">
        <h2>Learning alongside you</h2>
        <Link to="/me#settings" className="home-card-link">
          {data.sharing ? "Sharing on" : "Privacy"}
        </Link>
      </div>

      {!data.sharing ? (
        <div className="peers-optin">
          <p>
            See who else is on the same stage, so you can find someone to learn with. Only members who opt in appear — and
            only their name and stage are shown.
          </p>
          <button type="button" className="btn btn--sm" onClick={optIn} disabled={busy}>
            {busy ? "Turning on…" : "Show me (and share my stage)"}
          </button>
        </div>
      ) : groups.length === 0 || (groups.length === 1 && mine && others(mine).length === 0 && !data.finished.length) ? (
        <p className="md-status">
          You're the first to share. As others opt in, they'll show up here — say hi in a page's discussion in the meantime.
        </p>
      ) : (
        <div className="peers-groups">
          {groups.map((g) => (
            <div key={g.key} className={`peers-group${g === mine ? " is-mine" : ""}`}>
              <span className="peers-stage">
                {g.title}
                {g === mine && <em> · you're here</em>}
              </span>
              <div className="peers-avatars">
                {g.members.slice(0, 8).map((m) => (
                  <span
                    key={m.name + m.done}
                    className={`peers-avatar${m.you ? " is-you" : ""}${m.recentlyActive ? "" : " is-quiet"}`}
                    title={`${m.you ? "You" : m.name} · ${m.done} topic${m.done === 1 ? "" : "s"} done${m.recentlyActive ? " · active this week" : ""}`}
                  >
                    {initials(m.name)}
                  </span>
                ))}
                {g.members.length > 8 && <span className="peers-more">+{g.members.length - 8}</span>}
              </div>
              <span className="peers-names">
                {others(g)
                  .slice(0, 3)
                  .map((m) => m.name.split(" ")[0])
                  .join(", ")}
                {others(g).length > 3 && ` and ${others(g).length - 3} more`}
              </span>
            </div>
          ))}
          {data.finished.length > 0 && (
            <p className="peers-finished">🏁 {data.finished.length} member{data.finished.length === 1 ? " has" : "s have"} finished the whole path.</p>
          )}
        </div>
      )}
    </section>
  );
}
