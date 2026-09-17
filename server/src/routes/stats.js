const express = require("express");
const Revision = require("../models/Revision");
const Member = require("../models/Member");
const { ensureMember } = require("../middleware/ensureMember");

const router = express.Router();
router.use(ensureMember);

// What counts as a contribution. Two things are left out: the original
// markdown import (nobody typed it into the hub), and anything flagged by hand
// as setup or test work — see scripts/excludeFromStats.js.
const REAL_EDITS = {
  seeded: { $ne: true },
  excludeFromStats: { $ne: true },
  authorEmail: { $ne: null },
};

// The leaderboard ranks by words added, not by number of edits: the ask was to
// reward people who actually write, not people who save often.
router.get("/leaderboard", async (_req, res, next) => {
  try {
    const rows = await Revision.aggregate([
      { $match: REAL_EDITS },
      {
        $group: {
          _id: "$authorEmail",
          name: { $last: "$authorName" },
          wordsAdded: { $sum: "$wordsAdded" },
          linesAdded: { $sum: "$linesAdded" },
          wordsRemoved: { $sum: "$wordsRemoved" },
          linesRemoved: { $sum: "$linesRemoved" },
          edits: { $sum: 1 },
          pages: { $addToSet: "$slug" },
          lastEdit: { $max: "$createdAt" },
          firstEdit: { $min: "$createdAt" },
        },
      },
      { $sort: { wordsAdded: -1, linesAdded: -1, edits: -1 } },
      { $limit: 200 },
    ]);

    // Roles come from the member list so the board can badge leads, and so a
    // member removed from the club stops being listed.
    const members = await Member.find({ active: true }).select("collegeEmail name role department");
    const byEmail = new Map(members.map((m) => [m.collegeEmail.toLowerCase(), m]));

    const leaders = rows
      .filter((r) => r._id && byEmail.has(String(r._id).toLowerCase()))
      .map((r, i) => {
        const m = byEmail.get(String(r._id).toLowerCase());
        return {
          rank: i + 1,
          email: r._id,
          name: m.name || r.name || r._id,
          role: m.role,
          department: m.department || "",
          wordsAdded: r.wordsAdded || 0,
          linesAdded: r.linesAdded || 0,
          wordsRemoved: r.wordsRemoved || 0,
          linesRemoved: r.linesRemoved || 0,
          edits: r.edits || 0,
          pagesTouched: (r.pages || []).length,
          lastEdit: r.lastEdit,
          firstEdit: r.firstEdit,
        };
      })
      // Re-rank after filtering so positions are contiguous.
      .map((row, i) => ({ ...row, rank: i + 1 }));

    const totals = leaders.reduce(
      (acc, l) => ({
        contributors: acc.contributors + 1,
        wordsAdded: acc.wordsAdded + l.wordsAdded,
        linesAdded: acc.linesAdded + l.linesAdded,
        edits: acc.edits + l.edits,
      }),
      { contributors: 0, wordsAdded: 0, linesAdded: 0, edits: 0 }
    );

    res.json({ leaders, totals });
  } catch (err) {
    next(err);
  }
});

// One member's own numbers, plus the pages they've touched. Defaults to the
// signed-in member so anyone can see their own contribution without being an
// admin.
router.get("/stats/me", async (req, res, next) => {
  try {
    const email = (req.query.email || req.user.email).toLowerCase();

    const rows = await Revision.aggregate([
      { $match: { ...REAL_EDITS, authorEmail: email } },
      {
        $group: {
          _id: "$slug",
          wordsAdded: { $sum: "$wordsAdded" },
          linesAdded: { $sum: "$linesAdded" },
          edits: { $sum: 1 },
          lastEdit: { $max: "$createdAt" },
        },
      },
      { $sort: { wordsAdded: -1 } },
    ]);

    const totals = rows.reduce(
      (acc, r) => ({
        wordsAdded: acc.wordsAdded + r.wordsAdded,
        linesAdded: acc.linesAdded + r.linesAdded,
        edits: acc.edits + r.edits,
        pagesTouched: acc.pagesTouched + 1,
      }),
      { wordsAdded: 0, linesAdded: 0, edits: 0, pagesTouched: 0 }
    );

    // Rank is the member's position on the same ordering the board uses.
    const ahead = await Revision.aggregate([
      { $match: REAL_EDITS },
      { $group: { _id: "$authorEmail", wordsAdded: { $sum: "$wordsAdded" } } },
      { $match: { wordsAdded: { $gt: totals.wordsAdded } } },
      { $count: "n" },
    ]);

    res.json({
      email,
      totals,
      rank: totals.edits > 0 ? (ahead[0]?.n || 0) + 1 : null,
      pages: rows.map((r) => ({
        slug: r._id,
        wordsAdded: r.wordsAdded,
        linesAdded: r.linesAdded,
        edits: r.edits,
        lastEdit: r.lastEdit,
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
