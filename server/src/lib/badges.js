// Milestones a member can earn. Computed on demand from data the hub already
// has, so there's nothing to keep in sync and nothing to backfill.
const BADGES = [
  { id: "first-step", icon: "🌱", name: "First step", desc: "Ticked off your first roadmap topic" },
  { id: "foundations", icon: "🧱", name: "Solid foundations", desc: "Finished every topic in the first stage" },
  { id: "halfway", icon: "🧭", name: "Halfway there", desc: "Completed half the roadmap" },
  { id: "finisher", icon: "🏁", name: "Path complete", desc: "Completed the whole roadmap" },
  { id: "first-edit", icon: "✏️", name: "Contributor", desc: "Published your first edit to a page" },
  { id: "writer", icon: "📚", name: "Writer", desc: "Added 500+ words to the hub" },
  { id: "first-comment", icon: "💬", name: "Conversation starter", desc: "Posted your first comment" },
  { id: "helper", icon: "🤝", name: "Helper", desc: "Posted 10 comments" },
  { id: "streak-4", icon: "🔥", name: "On a roll", desc: "Used the hub 4 weeks in a row" },
  { id: "curator", icon: "⭐", name: "Curator", desc: "Marked 5 resources as helpful" },
];

function earnedBadges({ doneIds, stages, wordsAdded, edits, comments, streak, ratings }) {
  const total = stages.reduce((n, s) => n + s.topics.length, 0);
  const done = stages.reduce((n, s) => n + s.topics.filter((t) => doneIds.has(t)).length, 0);
  const firstStage = stages[0];
  const earned = new Set();
  if (done >= 1) earned.add("first-step");
  if (firstStage && firstStage.topics.length && firstStage.topics.every((t) => doneIds.has(t))) earned.add("foundations");
  if (total && done >= total / 2) earned.add("halfway");
  if (total && done === total) earned.add("finisher");
  if (edits >= 1) earned.add("first-edit");
  if (wordsAdded >= 500) earned.add("writer");
  if (comments >= 1) earned.add("first-comment");
  if (comments >= 10) earned.add("helper");
  if (streak >= 4) earned.add("streak-4");
  if (ratings >= 5) earned.add("curator");
  return BADGES.map((b) => ({ ...b, earned: earned.has(b.id) }));
}

module.exports = { BADGES, earnedBadges };
