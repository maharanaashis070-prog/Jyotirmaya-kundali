// KonarkWheel.jsx — the app's signature motif: the 24-spoke stone chariot
// wheel of the Konark Sun Temple, which doubles historically as a sundial.
// One shape, three jobs: loading spinner, dashboard watermark, section divider.

const SPOKES = 24;

/**
 * @param {number} size - px, square
 * @param {string} color - stroke/fill color (CSS value or currentColor)
 * @param {boolean} spin - animate slow rotation
 * @param {number} opacity
 * @param {string} className
 */
export default function KonarkWheel({
  size = 96,
  color = 'var(--color-gold)',
  spin = false,
  opacity = 1,
  className = '',
  ariaLabel,
}) {
  const cx = 100, cy = 100;
  const rimOuter = 92, rimInner = 80, hubOuter = 22, hubInner = 10;
  const spokeInner = 30, spokeOuter = 78;
  const beadR = 3.4;

  const spokes = Array.from({ length: SPOKES }, (_, i) => {
    const angle = (i * 360) / SPOKES;
    const rad = (angle * Math.PI) / 180;
    const x1 = cx + spokeInner * Math.sin(rad);
    const y1 = cy - spokeInner * Math.cos(rad);
    const x2 = cx + spokeOuter * Math.sin(rad);
    const y2 = cy - spokeOuter * Math.cos(rad);
    const bx = cx + ((rimOuter + rimInner) / 2) * Math.sin(rad);
    const by = cy - ((rimOuter + rimInner) / 2) * Math.cos(rad);
    return { key: i, x1, y1, x2, y2, bx, by };
  });

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      style={{ opacity, animation: spin ? 'konark-spin 24s linear infinite' : undefined }}
      role={ariaLabel ? 'img' : 'presentation'}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      <style>{`@keyframes konark-spin { to { transform: rotate(360deg); } }`}</style>
      <g transform={`translate(0,0)`} style={{ transformOrigin: '100px 100px' }}>
        {/* outer rim */}
        <circle cx={cx} cy={cy} r={rimOuter} fill="none" stroke={color} strokeWidth="3" />
        <circle cx={cx} cy={cy} r={rimInner} fill="none" stroke={color} strokeWidth="1.5" opacity="0.7" />
        {/* rim beading */}
        {spokes.map(s => (
          <circle key={`bead-${s.key}`} cx={s.bx} cy={s.by} r={beadR} fill={color} opacity="0.85" />
        ))}
        {/* spokes */}
        {spokes.map(s => (
          <line key={`spoke-${s.key}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={color} strokeWidth="2.25" strokeLinecap="round" />
        ))}
        {/* hub */}
        <circle cx={cx} cy={cy} r={hubOuter} fill="none" stroke={color} strokeWidth="3" />
        <circle cx={cx} cy={cy} r={hubInner} fill={color} opacity="0.9" />
        {/* eight-petal lotus mark inside hub ring, echoing sundial gnomon */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * 360) / 8;
          const r = (a * Math.PI) / 180;
          const px = cx + hubOuter * Math.sin(r);
          const py = cy - hubOuter * Math.cos(r);
          const qx = cx + (hubOuter - 7) * Math.sin(r);
          const qy = cy - (hubOuter - 7) * Math.cos(r);
          return <line key={`petal-${i}`} x1={qx} y1={qy} x2={px} y2={py} stroke={color} strokeWidth="1.5" opacity="0.6" />;
        })}
      </g>
    </svg>
  );
}
