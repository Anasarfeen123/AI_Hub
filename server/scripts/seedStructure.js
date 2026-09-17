#!/usr/bin/env node
/**
 * Migrates the navigation and roadmap out of the bundled files and into
 * MongoDB, so admins can add and arrange pages from the site itself.
 *
 * Reads:
 *   client/src/content/nav.js        -> Page.section / Page.order
 *   client/src/assets/roadmap.json   -> RoadmapStage docs + Page.roadmapStage
 *
 * Usage:
 *   cd server
 *   node scripts/seedStructure.js
 *
 * Safe to re-run: it only writes structural fields onto pages that already
 * exist, and upserts the stages. Page text is never touched.
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Page = require("../src/models/Page");
const RoadmapStage = require("../src/models/RoadmapStage");

const CLIENT = path.join(__dirname, "../../client/src");

// nav.js is an ES module, so it's parsed rather than imported.
function readNav() {
  const src = fs.readFileSync(path.join(CLIENT, "content/nav.js"), "utf8");
  const entries = [];
  const re = /title:\s*"([^"]+)",\s*\n?\s*path:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(src)) !== null) entries.push({ title: m[1], path: m[2] });
  return entries;
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set.");
  await mongoose.connect(process.env.MONGODB_URI);

  // --- Navigation ---------------------------------------------------------
  const nav = readNav();
  let topOrder = 0;
  const childOrder = {};
  let navUpdated = 0;
  let navMissing = [];

  for (const entry of nav) {
    const slug = entry.path;
    const section = slug.includes("/") ? slug.slice(0, slug.lastIndexOf("/")) : "";

    const page = await Page.findOne({ slug });
    if (!page) {
      navMissing.push(slug);
      continue;
    }

    page.title = entry.title;
    page.section = section;
    if (section) {
      childOrder[section] = (childOrder[section] || 0) + 1;
      page.order = childOrder[section];
    } else {
      page.order = topOrder++;
    }
    await page.save();
    navUpdated++;
  }

  // Pages that exist but aren't in nav.js (none today) go to the end rather
  // than silently vanishing from the menu.
  const orphans = await Page.find({ slug: { $nin: nav.map((n) => n.path) } });
  for (const p of orphans) {
    if (!p.section) p.order = topOrder++;
    await p.save();
  }

  console.log(`Nav: ${navUpdated} page(s) placed, ${orphans.length} not in nav.js appended`);
  if (navMissing.length) console.log(`  nav entries with no page: ${navMissing.join(", ")}`);

  // --- Roadmap ------------------------------------------------------------
  const roadmap = JSON.parse(fs.readFileSync(path.join(CLIENT, "assets/roadmap.json"), "utf8"));

  let stageCount = 0;
  let nodeCount = 0;
  const nodeMissing = [];

  for (const [i, stage] of roadmap.stages.entries()) {
    await RoadmapStage.findOneAndUpdate(
      { key: stage.id },
      {
        $set: {
          key: stage.id,
          label: stage.label,
          title: stage.title,
          goal: stage.goal,
          duration: stage.duration,
          num: stage.num,
          levelClass: stage.levelClass,
          order: i,
        },
      },
      { upsert: true }
    );
    stageCount++;

    for (const [j, node] of stage.nodes.entries()) {
      const slug = node.href.replace(/\/+$/, "");
      const page = await Page.findOne({ slug });
      if (!page) {
        nodeMissing.push(slug);
        continue;
      }
      page.roadmapStage = stage.id;
      page.roadmapOrder = j;
      page.roadmapDesc = node.desc || "";
      await page.save();
      nodeCount++;
    }
  }

  console.log(`Roadmap: ${stageCount} stage(s), ${nodeCount} topic(s) placed`);
  if (nodeMissing.length) console.log(`  roadmap nodes with no page: ${nodeMissing.join(", ")}`);

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
