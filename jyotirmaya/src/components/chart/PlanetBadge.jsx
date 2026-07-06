// PlanetBadge — a small emblem per graha, echoing the traditional Navagraha
// convention of giving each planet its own distinct frame shape. Every shape
// below is built from primitive geometry (arcs, circles, triangles) computed
// directly in this file — original line art, not a reproduction or trace of
// any figurative artwork (deity portrait, painting, or photo).
const SHAPES = {
  Sun:     { shape: 'sun',      color: 'var(--color-gold)' },
  Moon:    { shape: 'crescent', color: 'var(--color-indigo-light)' },
  Mars:    { shape: 'triangle', color: 'var(--color-laterite)' },
  Mercury: { shape: 'leaf',     color: 'var(--color-teal)' },
  Jupiter: { shape: 'star',     color: 'var(--color-gold-dark)' },
  Venus:   { shape: 'lotus',    color: 'var(--color-laterite-light)' },
  Saturn:  { shape: 'shield',   color: 'var(--color-indigo)' },
  Rahu:    { shape: 'eclipse',  color: 'var(--color-indigo-dark)' },
  Ketu:    { shape: 'comet',    color: 'var(--color-laterite-dark)' },
};

// A full circle drawn as two semicircular arcs — the standard, reliable way
// to express a circle as a path (needed so it can be combined with a second
// circle under an evenodd fill-rule to punch a crescent out of a disc).
function circlePath(cx, cy, r) {
  return `M${cx - r},${cy} A${r},${r} 0 1,0 ${cx + r},${cy} A${r},${r} 0 1,0 ${cx - r},${cy}`;
}

// 8-point radiant star for Jupiter (Guru) — computed directly rather than
// hand-plotted, so the points are exactly even.
function starPath(cx, cy, points, outerR, innerR) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i * Math.PI) / points - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
}

// Six lotus petals for Venus (Shukra) — each a simple two-curve teardrop
// rotated evenly around the centre.
function lotusPetals(cx, cy, count, len, width) {
  const paths = [];
  for (let i = 0; i < count; i++) {
    const deg = -90 + i * (360 / count);
    const a = (deg * Math.PI) / 180;
    const tipX = cx + len * Math.cos(a), tipY = cy + len * Math.sin(a);
    const midLen = len * 0.55;
    const midX = cx + midLen * Math.cos(a), midY = cy + midLen * Math.sin(a);
    const perpX = Math.cos(a + Math.PI / 2), perpY = Math.sin(a + Math.PI / 2);
    const c1x = midX + width * perpX, c1y = midY + width * perpY;
    const c2x = midX - width * perpX, c2y = midY - width * perpY;
    paths.push(
      `M${cx.toFixed(1)},${cy.toFixed(1)} Q${c1x.toFixed(1)},${c1y.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)} Q${c2x.toFixed(1)},${c2y.toFixed(1)} ${cx.toFixed(1)},${cy.toFixed(1)} Z`
    );
  }
  return paths;
}

const SHAPE_PATHS = {
  circle: <circle cx="24" cy="24" r="20" />,
  sun: <circle cx="24" cy="24" r="17" />,
  triangle: <path d="M24,5 L43,40 L5,40 Z" />,
  leaf: <path d="M24,4 C36,10 40,24 24,44 C8,24 12,10 24,4 Z" />,
  shield: <path d="M24,4 L42,10 V24 C42,36 34,42 24,45 C14,42 6,36 6,24 V10 Z" />,
  star: <path d={starPath(24, 24, 8, 19, 9)} />,
  // Waxing crescent: a large disc with a smaller offset disc subtracted via
  // evenodd — two full circles, no hand-guessed arc sweeps.
  crescent: <path fillRule="evenodd" d={`${circlePath(21, 24, 15)} ${circlePath(29, 22, 12)}`} />,
  // Rahu — the eclipse-causing shadow node — as a disc almost entirely
  // overtaken by a second disc, leaving only a thin sliver of light.
  eclipse: <path fillRule="evenodd" d={`${circlePath(24, 24, 16)} ${circlePath(29, 23, 14.5)}`} />,
  // Ketu — classically "the comet/banner planet" — a small head with a
  // tapering tail, echoing that association without any figurative drawing.
  comet: (
    <>
      <circle cx="16" cy="17" r="7" />
      <path d="M20,21 L44,44 L15,25 Z" />
    </>
  ),
  lotus: (
    <>
      {lotusPetals(24, 24, 6, 19, 6.5).map((d, i) => <path key={i} d={d} />)}
      <circle cx="24" cy="24" r="3.2" />
    </>
  ),
};

export default function PlanetBadge({ name, size = 40 }) {
  const meta = SHAPES[name] || { shape: 'circle', color: 'var(--color-gold)' };
  const path = SHAPE_PATHS[meta.shape];
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      {path && (
        <g fill={meta.color} fillOpacity="0.16" stroke={meta.color} strokeWidth="2">
          {path}
        </g>
      )}
      {meta.shape === 'sun' && (
        <g stroke={meta.color} strokeWidth="1.6" strokeLinecap="round" opacity="0.8">
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            const x1 = 24 + 19 * Math.sin(a), y1 = 24 - 19 * Math.cos(a);
            const x2 = 24 + 23 * Math.sin(a), y2 = 24 - 23 * Math.cos(a);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </g>
      )}
    </svg>
  );
}
