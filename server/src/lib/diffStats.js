// Measures how much a revision actually changed, so contribution can be scored
// by volume of writing rather than by how many times someone hit Save.
//
// The comparison is a line-level longest-common-subsequence, the same shape the
// client's DiffView uses, so what the leaderboard counts matches what an admin
// sees when they open a diff.

function toLines(text) {
  return (text || "").replace(/\r\n/g, "\n").split("\n");
}

function countWords(text) {
  const m = (text || "").trim().match(/\S+/g);
  return m ? m.length : 0;
}

// Classic LCS table. Bodies here are article-length (a few hundred lines at
// most), so the O(n*m) table is comfortably cheap and worth the exactness.
function lcsLengths(a, b) {
  const table = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  return table;
}

// Returns the added/removed lines between two bodies.
function diffLines(before, after) {
  const a = toLines(before);
  const b = toLines(after);
  const table = lcsLengths(a, b);

  const added = [];
  const removed = [];
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      removed.push(a[i++]);
    } else {
      added.push(b[j++]);
    }
  }
  while (i < a.length) removed.push(a[i++]);
  while (j < b.length) added.push(b[j++]);

  return { added, removed };
}

// The numbers stored on each Revision. Blank lines are not counted as added
// lines — reformatting a page shouldn't read as authorship.
function computeStats(before, after) {
  const { added, removed } = diffLines(before, after);

  const addedReal = added.filter((l) => l.trim() !== "");
  const removedReal = removed.filter((l) => l.trim() !== "");

  return {
    linesAdded: addedReal.length,
    linesRemoved: removedReal.length,
    wordsAdded: addedReal.reduce((n, l) => n + countWords(l), 0),
    wordsRemoved: removedReal.reduce((n, l) => n + countWords(l), 0),
    charsAdded: addedReal.reduce((n, l) => n + l.trim().length, 0),
  };
}

module.exports = { computeStats, diffLines, countWords, toLines };
