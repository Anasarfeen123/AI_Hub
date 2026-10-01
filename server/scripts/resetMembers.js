#!/usr/bin/env node
/**
 * Replaces the whole member list with a CSV, keeping every lead.
 *
 * For a fresh start — e.g. after a bulk add went in with the wrong addresses.
 * Every member who is not a lead is removed, then everyone in the CSV is
 * added as an active member. Leads are never touched, so the people running
 * the hub can't lock themselves out.
 *
 * Removing a member only removes their access. Their revisions, comments and
 * bylines keep the name they were written under.
 *
 * Usage:
 *   cd server
 *   node scripts/resetMembers.js members.csv           # preview only
 *   node scripts/resetMembers.js members.csv --write   # apply
 *
 * CSV format (header row required): name,email
 */

require("dotenv").config();
const fs = require("fs");
const mongoose = require("mongoose");
const Member = require("../src/models/Member");

const csvPath = process.argv[2];
const write = process.argv.includes("--write");

if (!csvPath || csvPath.startsWith("--")) {
  console.error("Usage: node scripts/resetMembers.js <members.csv> [--write]");
  process.exit(1);
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const header = lines.shift().split(",").map((h) => h.trim().toLowerCase());
  const nameIdx = header.indexOf("name");
  const emailIdx = header.indexOf("email");
  if (nameIdx === -1 || emailIdx === -1) throw new Error('CSV must have "name" and "email" columns');

  const seen = new Set();
  const rows = [];
  for (const line of lines.filter((l) => l.trim())) {
    const cols = line.split(",");
    const name = (cols[nameIdx] || "").trim();
    const email = (cols[emailIdx] || "").trim().toLowerCase();
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) throw new Error(`Bad row: "${line}"`);
    if (seen.has(email)) throw new Error(`Duplicate email in CSV: ${email}`);
    seen.add(email);
    rows.push({ name, email });
  }
  return rows;
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set.");

  const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
  await mongoose.connect(process.env.MONGODB_URI);

  const leads = await Member.find({ role: "superadmin" }).sort({ name: 1 });
  if (leads.length === 0) {
    throw new Error("No leads found. Refusing to reset — nobody would be left to run the hub.");
  }
  const leadEmails = new Set(leads.map((l) => l.collegeEmail));
  const toRemove = await Member.find({ role: { $ne: "superadmin" } }).sort({ name: 1 });
  const toAdd = rows.filter((r) => !leadEmails.has(r.email));

  console.log(`Database: ${mongoose.connection.host}/${mongoose.connection.name}\n`);
  console.log(`Keeping ${leads.length} lead(s):`);
  for (const l of leads) console.log(`  = ${l.name} <${l.collegeEmail}>`);
  console.log(`\nRemoving ${toRemove.length} other member(s):`);
  for (const m of toRemove) console.log(`  - ${m.name} <${m.collegeEmail}>${m.role === "admin" ? "  (admin)" : ""}`);
  console.log(`\nAdding ${toAdd.length} member(s) from ${csvPath}:`);
  for (const r of toAdd) console.log(`  + ${r.name} <${r.email}>`);
  if (toAdd.length < rows.length) console.log(`  (${rows.length - toAdd.length} CSV row(s) skipped — already a lead)`);

  if (!write) {
    console.log("\nPreview only. Nothing changed. Re-run with --write to apply.");
  } else {
    const removed = await Member.deleteMany({ role: { $ne: "superadmin" } });
    await Member.insertMany(toAdd.map((r) => ({ name: r.name, collegeEmail: r.email, active: true })));
    const total = await Member.countDocuments();
    console.log(`\nDone. Removed ${removed.deletedCount}, added ${toAdd.length}. ${total} member(s) on the list now.`);
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err.message || err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
