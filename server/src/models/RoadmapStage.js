const mongoose = require("mongoose");

// A stage of the learning path (Beginner / Intermediate / Advanced).
// The topics inside a stage aren't stored here — they're Pages that opted in
// via `roadmapStage`, so a topic and its page can't fall out of sync.
const roadmapStageSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    label: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    goal: { type: String, default: "" },
    duration: { type: String, default: "" },
    num: { type: String, default: "" },
    // Drives the stage's accent colour in the UI.
    levelClass: { type: String, default: "beginner" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoadmapStage", roadmapStageSchema);
