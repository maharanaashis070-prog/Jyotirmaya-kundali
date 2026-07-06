import { useMemo, useState } from 'react';
import { planetCode } from './planetGlyphs.js';
import KonarkWheel from '../common/KonarkWheel.jsx';

// Fixed-sign South Indian (Rasi) chart: a 4x4 grid where each of the 12
// outer cells always holds the same zodiac sign; the Ascendant is marked
// wherever its sign falls, rather than the grid rotating to meet it.
// Grid positions (row,col), clockwise from top-left starting at Pisces(11):
const GRID = [
  [11, 0, 1, 2],
  [10, -1, -1, 3],
  [9, -1, -1, 4],
  [8, 7, 6, 5],
];

export default function ChartWheelSouth({ lagnaRashiIdx, planets, selectedHouse, onSelectHouse, size = 400 }) {
  const bySign = useMemo(() => {
    const map = {};
    for (let i = 0; i < 12; i++) map[i] = [];
    planets.forEach(pl => { map[pl.rashi.idx]?.push(pl); });
    return map;
  }, [planets]);

  // House number (relative to lagna) for a given absolute sign index — used so
  // clicking a cell can still communicate "this is house N" to the rest of the UI.
  const houseOfSign = (signIdx) => ((signIdx - lagnaRashiIdx + 12) % 12) + 1;

  const [hover, setHover] = useState(null);
  const cell = 100;

  return (
    <svg viewBox="0 0 400 400" width={size} height={size} className="select-none" role="img" aria-label="South Indian birth chart">
      <rect x="0" y="0" width="400" height="400" fill="var(--color-indigo)" rx="6" />
      {GRID.map((row, r) => row.map((signIdx, c) => {
        const x = c * cell, y = r * cell;
        if (signIdx === -1) {
          if (r === 1 && c === 1) {
            return (
              <g key="center" transform={`translate(${cell},${cell})`}>
                <rect x="0" y="0" width={cell * 2} height={cell * 2} fill="none" stroke="var(--color-gold)" strokeOpacity="0.35" />
                <g transform={`translate(${cell},${cell})`}>
                  <KonarkWheel size={54} color="var(--color-gold)" opacity={0.45} />
                </g>
              </g>
            );
          }
          return null;
        }
        const houseNum = houseOfSign(signIdx);
        const isLagna = signIdx === lagnaRashiIdx;
        const isActive = selectedHouse === houseNum || hover === houseNum;
        const cellPlanets = bySign[signIdx] || [];
        return (
          <g key={`${r}-${c}`}>
            <rect
              x={x} y={y} width={cell} height={cell}
              fill={isActive ? 'rgba(201,151,31,0.22)' : 'transparent'}
              stroke="var(--color-gold)" strokeOpacity={isLagna ? 0.95 : 0.5} strokeWidth={isLagna ? 2.25 : 1}
              className="cursor-pointer transition-colors"
              onMouseEnter={() => setHover(houseNum)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelectHouse?.(houseNum)}
            />
            <text x={x + 8} y={y + 16} fontSize="11" fill="var(--color-gold-light)" opacity="0.85">
              {signIdx + 1}{isLagna ? ' •Asc' : ''}
            </text>
            {cellPlanets.length > 0 && (
              <text x={x + cell / 2} y={y + cell / 2 - (cellPlanets.length - 1) * 6.5} textAnchor="middle">
                {cellPlanets.map((pl, i) => (
                  <tspan key={pl.name} x={x + cell / 2} dy={i === 0 ? 0 : 13} fontSize="12" fill="var(--color-ivory)">
                    {planetCode(pl.name)}{pl.isRetro ? <tspan fill="var(--color-laterite-light)" fontSize="9">{' R'}</tspan> : null}
                  </tspan>
                ))}
              </text>
            )}
          </g>
        );
      }))}
    </svg>
  );
}
