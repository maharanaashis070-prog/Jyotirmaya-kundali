// GaugeRing — a sun-disc progress ring (Konark sundial echo) used for
// probability scores and strength percentages.
export default function GaugeRing({ value = 0, size = 108, stroke = 10, color = 'var(--color-gold)', label, sublabel }) {
  const v = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - v / 100);
  const center = size / 2;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={r} fill="none" stroke="var(--color-indigo)" strokeOpacity="0.08" strokeWidth={stroke} />
        <circle
          cx={center} cy={center} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: 'stroke-dashoffset 700ms ease' }}
        />
        <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" className="font-display" fontSize={size * 0.22} fill="var(--color-ink)">
          {Math.round(v)}
        </text>
        <text x="50%" y="66%" textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.09} fill="var(--color-ink)" opacity="0.55">
          %
        </text>
      </svg>
      {label && <span className="text-sm font-medium text-ink text-center">{label}</span>}
      {sublabel && <span className="text-xs text-ink/55 text-center">{sublabel}</span>}
    </div>
  );
}
