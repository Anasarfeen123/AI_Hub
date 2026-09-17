#!/usr/bin/env node
/**
 * One-time migration: load the original markdown files into MongoDB so pages
 * become editable in-app.
 *
 * Titles come from client/src/content/nav.js, which mirrors the site nav, so
 * a page's title matches what the sidebar shows.
 *
 * Usage:
 *   cd server
 *   node scripts/seedPages.js            # only creates pages that don't exist
 *   node scripts/seedPages.js --force    # also OVERWRITES existing page bodies
 *
 * Re-running without --force is safe: pages already in the database are left
 * alone, so member edits are never clobbered by a redeploy or a repeat run.
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Page = require("../src/models/Page");
const Revision = require("../src/models/Revision");

const force = process.argv.includes("--force");
const CONTENT_DIR = path.join(__dirname, "../../client/src/content");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

// Keeps the "/index" segment so the link base survives — see Page.linkBase.
function fileToRawPath(file) {
  return path.relative(CONTENT_DIR, file).split(path.sep).join("/").replace(/\.md$/, "");
}

function rawPathToSlug(rawPath) {
  return rawPath.endsWith("/index") ? rawPath.slice(0, -"/index".length) : rawPath;
}

function linkBaseOf(rawPath) {
  const i = rawPath.lastIndexOf("/");
  return i === -1 ? "" : rawPath.slice(0, i);
}

// Mirrors the client's stripLeadingH1 — the title is rendered separately, so
// the stored body starts below it.
function stripLeadingH1(body) {
  return body.replace(/^\s*#\s+.+\n+/, "");
}

function loadNavTitles() {
  const navPath = path.join(CONTENT_DIR, "nav.js");
  const src = fs.readFileSync(navPath, "utf8");
  const titles = {};
  const re = /title:\s*"([^"]+)",\s*\n?\s*path:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(src)) !== null) titles[m[2]] = m[1];
  return titles;
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set — copy server/.env.example to server/.env.");
  }

  const titles = loadNavTitles();
  const files = walk(CONTENT_DIR);
  console.log(`Found ${files.length} markdown file(s) in client/src/content`);

  await mongoose.connect(process.env.MONGODB_URI);

  let created = 0;
  let overwritten = 0;
  let skipped = 0;

  for (const file of files) {
    const rawPath = fileToRawPath(file);
    const slug = rawPathToSlug(rawPath);
    const linkBase = linkBaseOf(rawPath);
    const raw = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
    const body = stripLeadingH1(raw);
    const title = titles[slug] || slug;

    const existing = await Page.findOne({ slug });

    if (existing && !force) {
      skipped++;
      continue;
    }

    if (existing) {
      existing.body = body;
      existing.title = title;
      existing.linkBase = linkBase;
      await existing.save();
      overwritten++;
    } else {
      await Page.create({ slug, title, body, linkBase });
      created++;
    }

    await Revision.create({
      slug,
      body,
      authorName: "Initial import",
      note: existing ? "Re-seeded from the repository" : "Imported from the original markdown",
    });

    console.log(`${existing ? "↻" : "✓"} ${slug}`);
  }

  console.log(
    `\nDone. created=${created} overwritten=${overwritten} skipped=${skipped}` +
      (skipped && !force ? "  (already in the database — pass --force to overwrite)" : "")
  );
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
