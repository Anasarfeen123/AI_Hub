#!/usr/bin/env node
/**
 * Loads the MIC member allowlist into MongoDB from a local CSV.
 *
 * The CSV never gets committed (it's in server/.gitignore) — this repo is
 * public, and a member roster is personal data (names + college emails).
 *
 * Usage:
 *   cd server
 *   cp .env.example .env   # fill in MONGODB_URI at least
 *   node scripts/importMembers.js members.csv
 *
 * CSV format (header row required):
 *   name,email
 *   Jane Doe,jane.doe2024@vitstudent.ac.in
 *
 * Re-running is safe — it upserts by email. Members already in the DB but
 * missing from a re-run of the CSV are left untouched (not auto-removed);
 * deactivate someone by editing their `active` field directly in the DB,
 * or pass --replace to deactivate every existing member not in this CSV.
 */

require("dotenv").config();
const fs = require("fs");
const mongoose = require("mongoose");
const Member = require("../src/models/Member");

const csvPath = process.argv[2];
const replace = process.argv.includes("--replace");

if (!csvPath) {
  console.error("Usage: node scripts/importMembers.js <members.csv> [--replace]");
  process.exit(1);
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const header = lines.shift().split(",").map((h) => h.trim().toLowerCase());
  const nameIdx = header.indexOf("name");
  const emailIdx = header.indexOf("email");
  if (nameIdx === -1 || emailIdx === -1) {
    throw new Error('CSV must have "name" and "email" columns');
  }
  return lines
    .filter((l) => l.trim().length > 0)
    .map((line) => {
      const cols = line.split(",");
      return { name: cols[nameIdx].trim(), collegeEmail: cols[emailIdx].trim().toLowerCase() };
    });
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set — copy server/.env.example to server/.env and fill it in.");
  }

  const members = parseCsv(fs.readFileSync(csvPath, "utf8"));
  console.log(`Loaded ${members.length} member(s) from ${csvPath}`);

  await mongoose.connect(process.env.MONGODB_URI);

  for (const m of members) {
    await Member.findOneAndUpdate(
      { collegeEmail: m.collegeEmail },
      { $set: { name: m.name, active: true } },
      { upsert: true }
    );
    console.log(`✓ ${m.name} <${m.collegeEmail}>`);
  }

  if (replace) {
    const emails = members.map((m) => m.collegeEmail);
    const { modifiedCount } = await Member.updateMany(
      { collegeEmail: { $nin: emails } },
      { $set: { active: false } }
    );
    console.log(`Deactivated ${modifiedCount} member(s) not present in this CSV.`);
  }

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
