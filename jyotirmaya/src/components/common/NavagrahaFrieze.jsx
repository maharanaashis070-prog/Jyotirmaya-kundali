import PlanetBadge from '../chart/PlanetBadge.jsx';

// NavagrahaFrieze — a decorative panel of all nine grahas, arranged the way
// classical Navagraha panels are (a 3x3 grid, name below each figure), built
// entirely from this app's own original geometric emblems (see
// PlanetBadge.jsx) — not a trace, crop, or recolour of any existing painting,
// photo, or product image. Purely decorative; carries no chart data.
//
// Classical Navagraha panels give each deity its OWN frame silhouette
// (flame-circle, pointed oval, arch, triangle, diamond, bow, banner...) —
// that per-deity variety is the single most recognisable thing about the
// genre. The previous version put all nine in one identical bead-ringed
// circle, which flattened that variety away. FRAME_SHAPE below restores it:
// nine distinct outer-frame outlines, each still pure computed line art.
const GRAHAS = [
  { name: 'Sun', dev: 'सूर्य', label: 'Surya' },
  { name: 'Moon', dev: 'चंद्र', label: 'Chandra' },
  { name: 'Mercury', dev: 'बुध', label: 'Budha' },
  { name: 'Mars', dev: 'मंगल', label: 'Mangala' },
  { name: 'Jupiter', dev: 'गुरु', label: 'Guru' },
  { name: 'Venus', dev: 'शुक्र', label: 'Shukra' },
  { name: 'Saturn', dev: 'शनि', label: 'Shani' },
  { name: 'Rahu', dev: 'राहु', label: 'Rahu' },
  { name: 'Ketu', dev: 'केतु', label: 'Ketu' },
];

const PLANET_TINT = {
  Sun: 'var(--color-marigold)', Moon: 'var(--color-indigo-light)', Mercury: 'var(--color-leaf)',
  Mars: 'var(--color-laterite)', Jupiter: 'var(--color-gold-dark)', Venus: 'var(--color-laterite-light)',
  Saturn: 'var(--color-indigo)', Rahu: 'var(--color-indigo-dark)', Ketu: 'var(--color-laterite-dark)',
};

// Each entry returns an SVG frame outline (96x96 box, centred on 48,48) for
// that graha's medallion background, echoing the shape most traditionally
// associated with it.
const FRAME_SHAPE = {
  // Sun: circle wrapped in flame-tongue rays (rounded-square-ish points).
  Sun: (tint) => (
    <>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI * 2) / 12;
        const x1 = 48 + 32 * Math.cos(a), y1 = 48 + 32 * Math.sin(a);
        const x2 = 48 + 44 * Math.cos(a), y2 = 48 + 44 * Math.sin(a);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={tint} strokeWidth="3" strokeLinecap="round" opacity="0.55" />;
      })}
      <circle cx="48" cy="48" r="32" fill={tint} fillOpacity="0.08" stroke={tint} strokeOpacity="0.6" strokeWidth="1.4" />
    </>
  ),
  // Moon: a tall pointed oval (vesica), like a crescent-window frame.
  Moon: (tint) => (
    <path d="M48,10 C68,26 68,70 48,86 C28,70 28,26 48,10 Z" fill={tint} fillOpacity="0.08" stroke={tint} strokeOpacity="0.6" strokeWidth="1.4" />
  ),
  // Mercury: circle, plain and swift.
  Mercury: (tint) => <circle cx="48" cy="48" r="34" fill={tint} fillOpacity="0.08" stroke={tint} strokeOpacity="0.6" strokeWidth="1.4" />,
  // Mars: upward triangle, martial and sharp.
  Mars: (tint) => <path d="M48,8 L86,84 L10,84 Z" fill={tint} fillOpacity="0.08" stroke={tint} strokeOpacity="0.6" strokeWidth="1.4" strokeLinejoin="round" />,
  // Jupiter: diamond, the teacher's expansive four points.
  Jupiter: (tint) => <path d="M48,6 L90,48 L48,90 L6,48 Z" fill={tint} fillOpacity="0.08" stroke={tint} strokeOpacity="0.6" strokeWidth="1.4" strokeLinejoin="round" />,
  // Venus: a temple-arch frame (rounded top on a rectangle base), for beauty and grace.
  Venus: (tint) => <path d="M14,86 V44 A34,34 0 0 1 82,44 V86 Z" fill={tint} fillOpacity="0.08" stroke={tint} strokeOpacity="0.6" strokeWidth="1.4" />,
  // Saturn: a bow/quiver curve, slow and bound.
  Saturn: (tint) => <path d="M20,14 C48,26 48,70 20,82 M20,14 L20,82" fill="none" stroke={tint} strokeOpacity="0.6" strokeWidth="1.6" strokeLinecap="round" />,
  // Rahu / Ketu: banner/flag frames — the two always face opposite ways.
  Rahu: (tint) => <path d="M18,10 H72 L60,30 L72,50 H18 Z" fill={tint} fillOpacity="0.08" stroke={tint} strokeOpacity="0.6" strokeWidth="1.4" transform="translate(6,20)" />,
  Ketu: (tint) => <path d="M78,10 H24 L36,30 L24,50 H78 Z" fill={tint} fillOpacity="0.08" stroke={tint} strokeOpacity="0.6" strokeWidth="1.4" transform="translate(-6,20)" />,
};

// A ring of small beads around a circle — the recurring "temple roundel"
// motif already used elsewhere in this app (KonarkWheel's spokes, PlanetBadge's
// star), computed here rather than hand-plotted so spacing is always exact.
function beadRing(cx, cy, r, count, color) {
  return Array.from({ length: count }, (_, i) => {
    const a = (i * 2 * Math.PI) / count;
    return <circle key={i} cx={cx + r * Math.cos(a)} cy={cy + r * Math.sin(a)} r="1.6" fill={color} opacity="0.7" />;
  });
}

function Medallion({ graha }) {
  const tint = PLANET_TINT[graha.name] || 'var(--color-gold)';
  const frame = FRAME_SHAPE[graha.name];
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg viewBox="0 0 96 96" width={72} height={72} role="img" aria-label={`${graha.label} (${graha.dev})`}>
        {frame ? frame(tint) : <circle cx="48" cy="48" r="40" fill={tint} fillOpacity="0.08" stroke={tint} strokeOpacity="0.55" strokeWidth="1.2" />}
        {beadRing(48, 48, 44, 16, tint)}
        <g transform="translate(24,24)">
          <PlanetBadge name={graha.name} size={48} />
        </g>
      </svg>
      <p className="font-display text-sm text-indigo leading-none">{graha.dev}</p>
      <p className="text-[10px] text-ink/45 uppercase tracking-wide leading-none">{graha.label}</p>
    </div>
  );
}

export default function NavagrahaFrieze({ className = '' }) {
  return (
    <div className={`grid grid-cols-3 sm:grid-cols-9 gap-x-2 gap-y-4 justify-items-center ${className}`}>
      {GRAHAS.map(g => <Medallion key={g.name} graha={g} />)}
    </div>
  );
}
