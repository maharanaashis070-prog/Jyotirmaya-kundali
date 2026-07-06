import { useMemo, useState } from 'react';
import { planetCode } from './planetGlyphs.js';

// Fixed-position North Indian diamond (Rasi) chart. House 1 is always the
// top kite; house numbers proceed counter-clockwise (2 and 3 fall on the
// left, matching the traditional layout). Geometry derived from: a square,
// its two full diagonals, and the diamond joining the midpoints of its four
// sides — the classic construction, computed exactly rather than
// approximated. Planets sit in whichever house their bhavaRashi says they're in.
const P = {
  TL: [0, 0], TR: [400, 0], BR: [400, 400], BL: [0, 400],
  MT: [200, 0], MR: [400, 200], MB: [200, 400], ML: [0, 200],
  O: [200, 200], A: [100, 100], B: [300, 300], C: [300, 100], D: [100, 300],
};

const HOUSE_POLYGONS = {
  1: [P.MT, P.C, P.O, P.A],
  2: [P.MT, P.TL, P.A],
  3: [P.TL, P.ML, P.A],
  4: [P.ML, P.A, P.O, P.D],
  5: [P.ML, P.BL, P.D],
  6: [P.BL, P.MB, P.D],
  7: [P.MB, P.D, P.O, P.B],
  8: [P.MB, P.BR, P.B],
  9: [P.BR, P.MR, P.B],
  10: [P.MR, P.B, P.O, P.C],
  11: [P.MR, P.TR, P.C],
  12: [P.TR, P.MT, P.C],
};

function centroid(pts) {
  const n = pts.length;
  const x = pts.reduce((s, p) => s + p[0], 0) / n;
  const y = pts.reduce((s, p) => s + p[1], 0) / n;
  return [x, y];
}

// Nudge each house's label point a little toward the chart centre so text
// doesn't sit flush against the outer border.
function labelPoint(houseNum, pts) {
  const [cx, cy] = centroid(pts);
  const [ox, oy] = P.O;
  const t = 0.12;
  return [cx + (ox - cx) * t, cy + (oy - cy) * t];
}

export default function ChartWheelNorth({ lagnaRashiIdx, planets, selectedHouse, onSelectHouse, size = 400 }) {
  const houses = useMemo(() => {
    const map = {};
    for (let h = 1; h <= 12; h++) {
      const rashiIdx = (lagnaRashiIdx + h - 1) % 12;
      map[h] = { rashiIdx, rashiNum: rashiIdx + 1, planets: [] };
    }
    planets.forEach(pl => {
      if (map[pl.bhavaRashi]) map[pl.bhavaRashi].planets.push(pl);
    });
    return map;
  }, [lagnaRashiIdx, planets]);

  const [hover, setHover] = useState(null);

  return (
    <svg viewBox="0 0 400 400" width={size} height={size} className="select-none" role="img" aria-label="North Indian birth chart">
      <rect x="0" y="0" width="400" height="400" fill="var(--color-indigo)" rx="6" />
      {Object.entries(HOUSE_POLYGONS).map(([h, pts]) => {
        const houseNum = Number(h);
        const d = pts.map(p => p.join(',')).join(' ');
        const isActive = selectedHouse === houseNum || hover === houseNum;
        const isLagna = houseNum === 1;
        return (
          <polygon
            key={h}
            points={d}
            fill={isActive ? 'rgba(201,151,31,0.22)' : 'transparent'}
            stroke="var(--color-gold)"
            strokeWidth={isLagna ? 2.25 : 1}
            strokeOpacity={isLagna ? 0.95 : 0.55}
            className="cursor-pointer transition-colors"
            onMouseEnter={() => setHover(houseNum)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onSelectHouse?.(houseNum)}
          />
        );
      })}
      {Object.entries(houses).map(([h, info]) => {
        const houseNum = Number(h);
        const pts = HOUSE_POLYGONS[houseNum];
        const [lx, ly] = labelPoint(houseNum, pts);
        const rashiLabelOffset = houseNum === 1 || houseNum === 4 || houseNum === 7 || houseNum === 10 ? -34 : -20;
        return (
          <g key={h} pointerEvents="none">
            <text x={lx} y={ly + rashiLabelOffset} textAnchor="middle" fontSize="12" fill="var(--color-gold-light)" opacity="0.85" fontFamily="var(--font-body)">
              {info.rashiNum}
            </text>
            {info.planets.length === 0 ? null : (
              <text x={lx} y={ly} textAnchor="middle" fontFamily="var(--font-body)">
                {info.planets.map((pl, i) => (
                  <tspan key={pl.name} x={lx} dy={i === 0 ? 0 : 13} fontSize="12.5" fill="var(--color-ivory)">
                    {planetCode(pl.name)}{pl.isRetro ? <tspan fill="var(--color-laterite-light)" fontSize="9">{' R'}</tspan> : null}
                  </tspan>
                ))}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
