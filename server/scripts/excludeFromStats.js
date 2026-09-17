// Keeps an account's edits out of the leaderboard without touching the page
// history. Use it for test and setup work — the edits stay visible in Changes
// and stay revertible, they just stop counting as contribution.
//
//   node scripts/excludeFromStats.js someone@vitstudent.ac.in           # preview
//   node scripts/excludeFromStats.js someone@vitstudent.ac.in --write   # apply
//   node scripts/excludeFromStats.js someone@vitstudent.ac.in --undo --write
//
// Nothing is deleted, so this is always reversible with --undo.

require("dotenv").config();
const mongoose = require("mongoose");
const Revision = require("../src/models/Revision");

const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const UNDO = args.includes("--undo");
const emails = args.filter((a) => !a.startsWith("--")).map((e) => e.toLowerCase());

(async () => {
  if (emails.length === 0) {
    console.error("usage: node scripts/excludeFromStats.js <email> [<email>...] [--undo] [--write]");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const filter = { authorEmail: { $in: emails } };
  const affected = await Revision.find(filter).sort({ createdAt: 1 });

  console.log(`${affected.length} revision(s) by ${emails.join(", ")}:\n`);
  let words = 0;
  for (const r of affected) {
    words += r.wordsAdded || 0;
    const state = r.excludeFromStats ? "[excluded]" : "[counting] ";
    console.log(
      `  ${state} ${r.createdAt.toISOString().slice(0, 16)}  ${String(r.slug).padEnd(26)} +${String(r.wordsAdded || 0).padStart(4)}w`
    );
  }
  console.log(`\n${words} words total would ${UNDO ? "return to" : "leave"} the leaderboard.`);

  if (WRITE) {
    const res = await Revision.updateMany(filter, { $set: { excludeFromStats: !UNDO } });
    console.log(`\n${res.modifiedCount} revision(s) updated. History is untouched.`);
  } else {
    console.log("\nnothing written — re-run with --write to apply");
  }

  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
