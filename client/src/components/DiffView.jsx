import { useMemo } from "react";

// Line-level diff via a longest-common-subsequence table. Pages are a few
// hundred lines at most, so the O(n*m) table is fine and avoids pulling in a
// diff library for one screen.
function diffLines(before, after) {
  const a = before.split("\n");
  const b = after.split("\n");
  const n = a.length;
  const m = b.length;

  const lcs = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const rows = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      rows.push({ type: "same", text: a[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      rows.push({ type: "del", text: a[i] });
      i++;
    } else {
      rows.push({ type: "add", text: b[j] });
      j++;
    }
  }
  while (i < n) rows.push({ type: "del", text: a[i++] });
  while (j < m) rows.push({ type: "add", text: b[j++] });
  return rows;
}

// Unchanged stretches are collapsed to a few lines of context so a one-line
// change in a long page doesn't bury the reviewer.
function withContext(rows, context = 2) {
  const keep = new Array(rows.length).fill(false);
  rows.forEach((row, idx) => {
    if (row.type === "same") return;
    for (let k = Math.max(0, idx - context); k <= Math.min(rows.length - 1, idx + context); k++) {
      keep[k] = true;
    }
  });

  const out = [];
  let skipped = 0;
  rows.forEach((row, idx) => {
    if (keep[idx]) {
      if (skipped) {
        out.push({ type: "gap", text: `… ${skipped} unchanged line${skipped === 1 ? "" : "s"}` });
        skipped = 0;
      }
      out.push(row);
    } else {
      skipped++;
    }
  });
  if (skipped) out.push({ type: "gap", text: `… ${skipped} unchanged line${skipped === 1 ? "" : "s"}` });
  return out;
}

export default function DiffView({ before, after }) {
  const rows = useMemo(() => withContext(diffLines(before || "", after || "")), [before, after]);

  const added = rows.filter((r) => r.type === "add").length;
  const removed = rows.filter((r) => r.type === "del").length;

  return (
    <div className="diff">
      <p className="diff-stat">
        <span className="diff-plus">+{added}</span> <span className="diff-minus">−{removed}</span>
      </p>
      <pre className="diff-body">
        {rows.map((row, idx) => (
          <div key={idx} className={`diff-line diff-${row.type}`}>
            <span className="diff-marker">
              {row.type === "add" ? "+" : row.type === "del" ? "−" : " "}
            </span>
            {row.text || " "}
          </div>
        ))}
      </pre>
    </div>
  );
}
