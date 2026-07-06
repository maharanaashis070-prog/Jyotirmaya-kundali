import { X } from 'lucide-react';
import { planetCode } from './planetGlyphs.js';

export default function HouseDetailPanel({ houseNum, lagnaRashiIdx, planets, signNames, onClose }) {
  if (!houseNum) return null;
  const rashiIdx = (lagnaRashiIdx + houseNum - 1) % 12;
  const inHouse = planets.filter(p => p.bhavaRashi === houseNum);
  return (
    <div className="rounded-lg border border-gold/40 bg-indigo/5 p-4 mt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-display text-indigo">House {houseNum} · {signNames[rashiIdx]}</h4>
        <button onClick={onClose} aria-label="Close" className="text-ink/40 hover:text-ink"><X size={18} /></button>
      </div>
      {inHouse.length === 0 ? (
        <p className="text-sm text-ink/55">No planets placed here.</p>
      ) : (
        <ul className="space-y-1.5">
          {inHouse.map(p => (
            <li key={p.name} className="text-sm flex flex-wrap items-baseline gap-x-2">
              <span className="font-medium text-ink">{planetCode(p.name)} {p.name}</span>
              <span className="text-ink/60">{p.rashi.name} {p.degreeInRashi?.decimal?.toFixed(2)}°</span>
              <span className="text-ink/50">{p.nakshatra} pada {p.pada}</span>
              {p.isRetro && <span className="text-laterite">retrograde</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
