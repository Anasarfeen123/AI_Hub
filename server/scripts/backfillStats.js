// Backfills contribution stats onto revisions written before the leaderboard
// existed. Walks each page's history in order and diffs each revision against
// the one before it, exactly as a live save would.
//
//   node scripts/backfillStats.js          # report only
//   node scripts/backfillStats.js --write  # apply
//
// Re-running is safe: the numbers are recomputed from the bodies each time.

require("dotenv").config();
const mongoose = require("mongoose");
const Revision = require("../src/models/Revision");
const { computeStats } = require("../src/lib/diffStats");

const WRITE = process.argv.includes("--write");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const slugs = await Revision.distinct("slug");
  let updated = 0;
  let seeded = 0;

  for (const slug of slugs) {
    const history = await Revision.find({ slug }).sort({ createdAt: 1 });

    let previousBody = "";
    for (const [i, rev] of history.entries()) {
      // The first revision of a page is the original markdown import. It is
      // marked as seeded rather than credited, so the import doesn't win the
      // leaderboard.
      const isSeed = i === 0 && /imported from the original markdown/i.test(rev.note || "");
      const stats = computeStats(previousBody, rev.body);

      if (WRITE) {
        await Revision.updateOne({ _id: rev._id }, { $set: { ...stats, seeded: isSeed } });
      }
      if (isSeed) seeded++;
      updated++;
      previousBody = rev.body;
    }
  }

  console.log(`${WRITE ? "updated" : "would update"} ${updated} revisions across ${slugs.length} pages`);
  console.log(`${seeded} marked as the original import (excluded from the leaderboard)`);
  if (!WRITE) console.log("\nnothing written — re-run with --write to apply");

  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
