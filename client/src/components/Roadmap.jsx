import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useRoadmapProgress, useRoadmapStages, countDone, toRoute } from "../hooks/useRoadmap";

export default function Roadmap() {
  const { progress, setDone, reset } = useRoadmapProgress();
  const stages = useRoadmapStages();

  const { totalNodes, totalDone } = useMemo(() => {
    let totalNodes = 0;
    let totalDone = 0;
    (stages || []).forEach((stage) => {
      totalNodes += stage.nodes.length;
      totalDone += countDone(stage.nodes, progress);
    });
    return { totalNodes, totalDone };
  }, [progress, stages]);


  if (!stages) return <p className="md-status">Loading roadmap…</p>;
  if (stages.length === 0) {
    return <p className="md-status">No roadmap stages yet.</p>;
  }

  return (
    <div className="roadmap-app">
      <div className="roadmap-summary">
        <span>
          {totalDone}/{totalNodes} topics checked off
        </span>
        <button type="button" className="roadmap-reset" onClick={reset}>
          Reset progress
        </button>
      </div>

      <div className="roadmap-flow">
        {stages.map((stage, i) => {
          const done = countDone(stage.nodes, progress);
          const pct = stage.nodes.length ? Math.round((done / stage.nodes.length) * 100) : 0;

          return (
            <div key={stage.id} style={{ display: "contents" }}>
              <div className={`roadmap-stage roadmap-stage--${stage.levelClass}`}>
                {/* A watermark numeral, deliberately near-invisible. The stage is already
                    named by the badge beside it, so this is decoration only. */}
                <span className="roadmap-stage-num" aria-hidden="true">{stage.num}</span>
                <div className="roadmap-stage-head">
                  <span className={`hub-level-badge ${stage.levelClass}`}>{stage.label}</span>
                  <span className="roadmap-duration">{stage.duration}</span>
                </div>
                <h3>{stage.title}</h3>
                <p className="roadmap-goal">{stage.goal}</p>
                <div
                  className="roadmap-progress"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${stage.title} progress`}
                >
                  <div className="roadmap-progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="roadmap-progress-label">
                  {done}/{stage.nodes.length} done
                </span>

                <div className="roadmap-nodes">
                  {stage.nodes.map((node) => {
                    const isDone = !!progress[node.id];
                    return (
                      <div key={node.id} className={`roadmap-node${isDone ? " is-done" : ""}`}>
                        <Link to={toRoute(node.href)} className="roadmap-node-title">
                          {node.title}
                        </Link>
                        <p className="roadmap-node-desc">{node.desc}</p>
                        <label className="roadmap-node-check">
                          <input
                            type="checkbox"
                            checked={isDone}
                            aria-label={`Mark "${node.title}" as done`}
                            onChange={(e) => setDone(node.id, e.target.checked)}
                          />
                          <span className="roadmap-checkmark" aria-hidden="true">
                            ✓
                          </span>
                          <span>Done</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {i < stages.length - 1 && <div className="roadmap-arrow">→</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
