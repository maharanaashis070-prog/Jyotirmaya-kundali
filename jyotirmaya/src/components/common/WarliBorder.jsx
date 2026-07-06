// WarliBorder.jsx — a tileable decorative strip inspired by the Warli folk
// art GENRE (circle-dance stick figures, a tree, a hut roofline) — a
// centuries-old tribal painting style from Maharashtra, not owned by any
// single artist. Every figure here is generated from primitive geometry in
// this file; nothing is traced or cropped from any photo, painting, or
// product image. Purely decorative.

function stickFigure(cx, headY, s, color, armsUp) {
  const headR = 3 * s;
  const torsoTop = headY + headR * 1.7;
  const torsoMid = torsoTop + 5 * s;
  const torsoBot = torsoMid + 5 * s;
  const shoulderW = 4.2 * s, hipW = 3.6 * s, waistW = 0.9 * s;
  // Torso as two triangles meeting at the waist — the classic Warli "hourglass" body.
  const torso = `M${cx - shoulderW},${torsoTop} L${cx + shoulderW},${torsoTop} L${cx + waistW},${torsoMid} Z ` +
    `M${cx - hipW},${torsoBot} L${cx + hipW},${torsoBot} L${cx - waistW},${torsoMid} Z`;
  const armY = torsoTop + 1.5 * s;
  const armDx = 6 * s, armDy = armsUp ? -5 * s : 4.5 * s;
  const legDx = 4.5 * s, legDy = 7 * s;
  return (
    <g key={`${cx}-${headY}`} stroke={color} fill={color} strokeWidth={Math.max(0.9, s * 0.55)} strokeLinecap="round">
      <circle cx={cx} cy={headY} r={headR} fill={color} stroke="none" />
      <path d={torso} fillRule="evenodd" />
      <line x1={cx} y1={armY} x2={cx - armDx} y2={armY + armDy} />
      <line x1={cx} y1={armY} x2={cx + armDx} y2={armY + armDy} />
      <line x1={cx} y1={torsoBot} x2={cx - legDx} y2={torsoBot + legDy} />
      <line x1={cx} y1={torsoBot} x2={cx + legDx} y2={torsoBot + legDy} />
    </g>
  );
}

function tree(cx, baseY, s, color) {
  const trunkH = 14 * s;
  return (
    <g key={`tree-${cx}`} stroke={color} fill="none" strokeLinecap="round">
      <line x1={cx} y1={baseY} x2={cx} y2={baseY - trunkH} strokeWidth={s} />
      {[0, 1, 2, 3, 4].map(i => {
        const t = i / 4;
        const y = baseY - trunkH * 0.35 - trunkH * 0.6 * t;
        const spread = (6 + i * 2.2) * s;
        return (
          <g key={i}>
            <line x1={cx} y1={y} x2={cx - spread} y2={y - spread * 0.55} strokeWidth={Math.max(0.6, s * 0.4)} />
            <line x1={cx} y1={y} x2={cx + spread} y2={y - spread * 0.55} strokeWidth={Math.max(0.6, s * 0.4)} />
          </g>
        );
      })}
    </g>
  );
}

function hut(cx, baseY, s, color) {
  const w = 16 * s, h = 10 * s, roofH = 7 * s;
  return (
    <g key={`hut-${cx}`} stroke={color} fill="none" strokeLinecap="round" strokeWidth={Math.max(0.8, s * 0.5)}>
      <path d={`M${cx - w / 2 - 3 * s},${baseY - h} L${cx},${baseY - h - roofH} L${cx + w / 2 + 3 * s},${baseY - h}`} />
      <rect x={cx - w / 2} y={baseY - h} width={w} height={h} />
      <line x1={cx - 2 * s} y1={baseY} x2={cx - 2 * s} y2={baseY - h * 0.55} />
      <line x1={cx + 2 * s} y1={baseY} x2={cx + 2 * s} y2={baseY - h * 0.55} />
    </g>
  );
}

// The hand-holding circle-dance ("tarpa" / harvest dance) is THE single most
// recognisable Warli motif — it's the centrepiece of both reference paintings
// (the spiral of linked figures top-left, and the ring mid-panel). The
// previous border used only a straight row of dancers and never this ring,
// so it was missing the genre's signature image. Same primitive stick-figure
// body as elsewhere, just placed radially and re-oriented so each figure
// faces the ring's centre with linked arms.
function danceCircle(cx, cy, r, count, s, color) {
  const figures = Array.from({ length: count }, (_, i) => {
    const a = (i * 2 * Math.PI) / count - Math.PI / 2;
    const hx = cx + r * Math.cos(a), hy = cy + r * Math.sin(a);
    const headR = 2.6 * s;
    // Body points outward from the circle's centre (head is the outermost point).
    const outA = a;
    const headCx = hx + headR * 1.2 * Math.cos(outA), headCy = hy + headR * 1.2 * Math.sin(outA);
    const torsoTop = { x: hx + headR * 2.6 * Math.cos(outA), y: hy + headR * 2.6 * Math.sin(outA) };
    const torsoBot = { x: cx + (r - 9 * s) * Math.cos(a), y: cy + (r - 9 * s) * Math.sin(a) };
    const tangent = outA + Math.PI / 2;
    const armLen = 5.5 * s;
    // Linked hands: each figure's two arm-tips reach toward its neighbours
    // along the ring's tangent direction.
    const arm1 = { x: torsoTop.x + armLen * Math.cos(tangent), y: torsoTop.y + armLen * Math.sin(tangent) };
    const arm2 = { x: torsoTop.x - armLen * Math.cos(tangent), y: torsoTop.y - armLen * Math.sin(tangent) };
    const legSpread = 3.6 * s;
    const leg1 = { x: torsoBot.x + legSpread * Math.cos(tangent), y: torsoBot.y + legSpread * Math.sin(tangent) };
    const leg2 = { x: torsoBot.x - legSpread * Math.cos(tangent), y: torsoBot.y - legSpread * Math.sin(tangent) };
    return (
      <g key={i} stroke={color} fill={color} strokeWidth={Math.max(0.8, s * 0.5)} strokeLinecap="round">
        <circle cx={headCx} cy={headCy} r={headR} stroke="none" />
        <line x1={torsoTop.x} y1={torsoTop.y} x2={torsoBot.x} y2={torsoBot.y} />
        <line x1={torsoTop.x} y1={torsoTop.y} x2={arm1.x} y2={arm1.y} />
        <line x1={torsoTop.x} y1={torsoTop.y} x2={arm2.x} y2={arm2.y} />
        <line x1={torsoBot.x} y1={torsoBot.y} x2={leg1.x} y2={leg1.y} />
        <line x1={torsoBot.x} y1={torsoBot.y} x2={leg2.x} y2={leg2.y} />
      </g>
    );
  });
  return (
    <g key={`ring-${cx}-${cy}`}>
      <circle cx={cx} cy={cy} r={r - 10 * s} fill="none" stroke={color} strokeWidth={Math.max(0.5, s * 0.3)} opacity="0.35" strokeDasharray="1.5 3" />
      {figures}
    </g>
  );
}

// A pair of simple V-wing birds in flight, a small recurring accent near the
// trees in both reference paintings.
function birdPair(cx, cy, s, color) {
  return (
    <g key={`birds-${cx}`} stroke={color} fill="none" strokeLinecap="round" strokeWidth={Math.max(0.7, s * 0.45)}>
      <path d={`M${cx - 5 * s},${cy} Q${cx - 2 * s},${cy - 3 * s} ${cx},${cy} Q${cx + 2 * s},${cy - 3 * s} ${cx + 5 * s},${cy}`} />
      <path d={`M${cx + 9 * s},${cy + 4 * s} Q${cx + 12 * s},${cy + 1.5 * s} ${cx + 14 * s},${cy + 4 * s} Q${cx + 16 * s},${cy + 1.5 * s} ${cx + 19 * s},${cy + 4 * s}`} />
    </g>
  );
}

/**
 * @param {string} color - CSS color/var for the figures (defaults to a laterite-on-ivory feel)
 * @param {number} repeats - how many motif groups to lay out (alternates a
 *   row-of-dancers group with a dance-CIRCLE group so both of the genre's
 *   signature compositions — the line and the ring — appear across the strip)
 */
export default function WarliBorder({ color = 'var(--color-laterite)', repeats = 3, className = '' }) {
  const groupWidth = 260;
  const width = groupWidth * repeats;
  const baseY = 56;
  const s = 1.15;

  const groups = Array.from({ length: repeats }, (_, g) => {
    const gx = g * groupWidth;
    if (g % 2 === 1) {
      // Odd groups: the hand-holding dance circle, a tree, and birds overhead —
      // the ring composition from the reference paintings, alternating with
      // the row composition below so the strip shows both.
      return (
        <g key={g}>
          {danceCircle(gx + 55, 30, 23, 8, s, color)}
          {tree(gx + 150, baseY, s * 1.3, color)}
          {birdPair(gx + 200, 14, s, color)}
          {hut(gx + 225, baseY, s, color)}
        </g>
      );
    }
    const figures = Array.from({ length: 5 }, (_, i) => stickFigure(gx + 18 + i * 13, baseY - 22, s, color, i % 2 === 0));
    return (
      <g key={g}>
        {figures}
        {tree(gx + 120, baseY, s * 1.3, color)}
        {hut(gx + 190, baseY, s, color)}
        {stickFigure(gx + 230, baseY - 22, s, color, true)}
      </g>
    );
  });

  return (
    <svg viewBox={`0 0 ${width} 60`} width="100%" height="48" preserveAspectRatio="xMidYMid meet" className={className} role="presentation" aria-hidden="true">
      {groups}
    </svg>
  );
}
