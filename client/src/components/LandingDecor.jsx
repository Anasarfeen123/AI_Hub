// The banner's design language, redrawn as one lightweight SVG instead of a
// background image: rounded diagonal slabs in the brand colours, thin
// "circuit" lines ending in nodes, hexagon outlines, plus marks and dot grids.
// Everything sits at the edges and between sections — never behind the
// headline or the sign-in button — and dims itself in the dark theme.
const hexagon = (cx, cy, r) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");

const dots = (x0, y0, cols, rows, gap) =>
  Array.from({ length: cols * rows }, (_, i) => (
    <circle key={i} cx={x0 + (i % cols) * gap} cy={y0 + Math.floor(i / cols) * gap} r="1.6" />
  ));

const plus = (x, y, s = 9) => `M${x - s} ${y}h${s * 2}M${x} ${y - s}v${s * 2}`;

export default function LandingDecor() {
  return (
    <svg className="lp-decor" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="lpd-orange" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#d9482a" />
          <stop offset="0.45" stopColor="#e0862a" />
          <stop offset="1" stopColor="#e0a83a" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lpd-blue" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a9fd0" />
          <stop offset="0.6" stopColor="#3a62c8" />
          <stop offset="1" stopColor="#3a62c8" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="lpd-teal" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a92a8" />
          <stop offset="0.55" stopColor="#3cb07a" stopOpacity="0.7" />
          <stop offset="1" stopColor="#3cb07a" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Slabs: rounded parallelograms leaning like the banner's. */}
      <path className="lpd-slab lpd-slab--orange" d="M-280 410 Q-272 390 -250 390 H-36 Q-18 390 -10 406 L290 900 H-280 Z" fill="url(#lpd-orange)" />
      <path className="lpd-slab lpd-slab--blue" d="M1150 -40 H1500 V250 H1352 Q1328 250 1316 230 L1150 -40 Z" fill="url(#lpd-blue)" />
      <path className="lpd-slab lpd-slab--teal" d="M1500 430 V900 H1288 L1360 450 Q1366 430 1390 430 Z" fill="url(#lpd-teal)" />

      {/* Circuit lines with their nodes. */}
      <g className="lpd-lines" fill="none" strokeWidth="1.2">
        <path className="lpd-line--blue" d="M760 -10 L880 108 H1120" />
        <path className="lpd-line--orange" d="M-10 698 H500 L620 820" />
        <path className="lpd-line--teal" d="M1180 900 L1300 760 H1450" />
      </g>
      <circle className="lpd-node lpd-node--blue" cx="1126" cy="108" r="9" />
      <circle className="lpd-node lpd-node--orange" cx="506" cy="698" r="9" />

      <g className="lpd-outline" fill="none" strokeWidth="1.4">
        <polygon points={hexagon(56, 470, 26)} />
        <polygon points={hexagon(1360, 640, 24)} />
        <path d={plus(452, 120)} />
        <path d={plus(1392, 300)} />
        <path d={plus(1268, 852)} />
      </g>
      <g className="lpd-dots">
        {dots(30, 540, 4, 5, 13)}
        {dots(1336, 470, 4, 4, 13)}
      </g>
    </svg>
  );
}
