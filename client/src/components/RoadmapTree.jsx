import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useRoadmapProgress, useRoadmapStages, countDone, toRoute } from "../hooks/useRoadmap";

// Shares the homepage roadmap's storage key on purpose — ticking a topic in
// either view is the same act, so progress follows the member around.
export default function RoadmapTree() {
  const { progress, setDone, reset } = useRoadmapProgress();
  const stages = useRoadmapStages();

  const [collapsed, setCollapsed] = useState({});

  const { totalNodes, totalDone } = useMemo(() => {
    let totalNodes = 0;
    let totalDone = 0;
    (stages || []).forEach((stage) => {
      totalNodes += stage.nodes.length;
      totalDone += countDone(stage.nodes, progress);
    });
    return { totalNodes, totalDone };
  }, [progress, stages]);

  const overallPct = totalNodes ? Math.round((totalDone / totalNodes) * 100) : 0;


  const toggleStage = (id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  if (!stages) return <p className="md-status">Loading roadmap…</p>;
  if (stages.length === 0) {
    return <p className="md-status">No roadmap stages yet.</p>;
  }

  return (
    <div className="roadmap-app">
      <div className="roadmap-summary">
        <span>
          {totalDone}/{totalNodes} topics done · {overallPct}%
        </span>
        <button type="button" className="roadmap-reset" onClick={reset}>
          Reset progress
        </button>
      </div>

      {/* A single spine runs top to bottom; stage markers sit on it and topic
          cards branch alternately left and right, roadmap.sh style. */}
      <div className="tree">
        {stages.map((stage) => {
          const done = countDone(stage.nodes, progress);
          const pct = stage.nodes.length ? Math.round((done / stage.nodes.length) * 100) : 0;
          const isCollapsed = !!collapsed[stage.id];

          return (
            <section
              className={`tree-stage tree-stage--${stage.levelClass}`}
              key={stage.id}
              aria-label={stage.title}
            >
              <header className="tree-stage-marker">
                <button
                  type="button"
                  className="tree-stage-toggle"
                  onClick={() => toggleStage(stage.id)}
                  aria-expanded={!isCollapsed}
                >
                  <span className="tree-stage-badge">{stage.label}</span>
                  <h3>{stage.title}</h3>
                  <span className="tree-stage-chevron" aria-hidden="true">
                    {isCollapsed ? "▾" : "▴"}
                  </span>
                </button>

                <p className="tree-stage-goal">{stage.goal}</p>

                <div
                  className="tree-stage-progress"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${stage.title} progress`}
                >
                  <div className="tree-stage-progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <p className="tree-stage-meta">
                  {stage.duration} · {done}/{stage.nodes.length} done
                </p>
              </header>

              {!isCollapsed && (
                <ol className="tree-branches">
                  {stage.nodes.map((node, i) => {
                    const isDone = !!progress[node.id];
                    return (
                      <li
                        className={`tree-branch tree-branch--${i % 2 === 0 ? "left" : "right"}${
                          isDone ? " is-done" : ""
                        }`}
                        key={node.id}
                      >
                        <div className="tree-node">
                          <Link to={toRoute(node.href)} className="tree-node-title">
                            {node.title}
                          </Link>
                          <p className="tree-node-desc">{node.desc}</p>
                          <label className="tree-node-check">
                            <input
                              type="checkbox"
                              checked={isDone}
                              aria-label={`Mark "${node.title}" as done`}
                              onChange={(e) => setDone(node.id, e.target.checked)}
                            />
                            <span className="tree-checkmark" aria-hidden="true">
                              ✓
                            </span>
                            <span>{isDone ? "Done" : "Mark done"}</span>
                          </label>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
