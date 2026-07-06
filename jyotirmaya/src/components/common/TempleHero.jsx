// TempleHero.jsx — decorative banner: a Konark-wheel "sun" rising behind a
// Rekha Deula temple skyline silhouette (Puri/Bhubaneswar/Konark inspired),
// against a deep indigo night sky. Purely decorative chrome; no astrology
// data lives here.
export default function TempleHero({ children, className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-lg night-texture ${className}`} style={{ background: 'linear-gradient(180deg, var(--color-indigo-dark), var(--color-indigo-light))' }}>
      <svg viewBox="0 0 800 260" className="w-full h-auto block" preserveAspectRatio="xMidYMax slice" role="presentation" aria-hidden="true">
        <g opacity="0.75">
          <circle cx="70" cy="40" r="1.4" fill="var(--color-ivory)" />
          <circle cx="130" cy="70" r="1" fill="var(--color-ivory)" />
          <circle cx="500" cy="35" r="1.4" fill="var(--color-ivory)" />
          <circle cx="650" cy="55" r="1" fill="var(--color-ivory)" />
          <circle cx="750" cy="90" r="1.2" fill="var(--color-ivory)" />
          <circle cx="30" cy="110" r="1" fill="var(--color-ivory)" />
          <circle cx="380" cy="60" r="1.1" fill="var(--color-ivory)" />
        </g>
        <circle cx="420" cy="150" r="96.2" fill="#C9971F" opacity="0.16"/>
  <circle cx="420" cy="150" r="78.2" fill="none" stroke="#C9971F" strokeWidth="2.4" opacity="0.9"/>
  <circle cx="420" cy="150" r="68.0" fill="none" stroke="#C9971F" strokeWidth="1.2" opacity="0.6"/>
  <line x1="420.0" y1="124.5" x2="420.0" y2="83.7" stroke="#C9971F" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
  <circle cx="420.0" cy="76.9" r="2.9" fill="#C9971F" opacity="0.75"/>
  <line x1="426.6" y1="125.4" x2="437.2" y2="86.0" stroke="#C9971F" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
  <circle cx="438.9" cy="79.4" r="2.9" fill="#C9971F" opacity="0.75"/>
  <line x1="432.8" y1="127.9" x2="453.1" y2="92.6" stroke="#C9971F" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
  <circle cx="456.6" cy="86.7" r="2.9" fill="#C9971F" opacity="0.75"/>
  <line x1="438.0" y1="132.0" x2="466.9" y2="103.1" stroke="#C9971F" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
  <circle cx="471.7" cy="98.3" r="2.9" fill="#C9971F" opacity="0.75"/>
  <line x1="442.1" y1="137.2" x2="477.4" y2="116.8" stroke="#C9971F" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
  <circle cx="483.3" cy="113.4" r="2.9" fill="#C9971F" opacity="0.75"/>
  <line x1="444.6" y1="143.4" x2="484.0" y2="132.8" stroke="#C9971F" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
  <circle cx="490.6" cy="131.1" r="2.9" fill="#C9971F" opacity="0.75"/>
  <line x1="445.5" y1="150.0" x2="486.3" y2="150.0" stroke="#C9971F" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
  <circle cx="493.1" cy="150.0" r="2.9" fill="#C9971F" opacity="0.75"/>
  <line x1="444.6" y1="156.6" x2="484.0" y2="167.2" stroke="#C9971F" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
  <circle cx="490.6" cy="168.9" r="2.9" fill="#C9971F" opacity="0.75"/>
  <line x1="442.1" y1="162.8" x2="477.4" y2="183.1" stroke="#C9971F" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
  <circle cx="483.3" cy="186.5" r="2.9" fill="#C9971F" opacity="0.75"/>
  <line x1="438.0" y1="168.0" x2="466.9" y2="196.9" stroke="#C9971F" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
  <circle cx="471.7" cy="201.7" r="2.9" fill="#C9971F" opacity="0.75"/>
  <line x1="432.8" y1="172.1" x2="453.1" y2="207.4" stroke="#C9971F" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
  <circle cx="456.6" cy="213.3" r="2.9" fill="#C9971F" opacity="0.75"/>
  <line x1="426.6" y1="174.6" x2="437.2" y2="214.0" stroke="#C9971F" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
  <circle cx="438.9" cy="220.6" r="2.9" fill="#C9971F" opacity="0.75"/>
  <line x1="420.0" y1="175.5" x2="420.0" y2="216.3" stroke="#C9971F" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
  <circle cx="420.0" cy="223.1" r="2.9" fill="#C9971F" opacity="0.75"/>
  <line x1="413.4" y1="174.6" x2="402.8" y2="214.0" stroke="#C9971F" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
  <circle cx="401.1" cy="220.6" r="2.9" fill="#C9971F" opacity="0.75"/>
  <line x1="407.2" y1="172.1" x2="386.9" y2="207.4" stroke="#C9971F" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
  <circle cx="383.4" cy="213.3" r="2.9" fill="#C9971F" opacity="0.75"/>
  <line x1="402.0" y1="168.0" x2="373.1" y2="196.9" stroke="#C9971F" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
  <circle cx="368.3" cy="201.7" r="2.9" fill="#C9971F" opacity="0.75"/>
  <line x1="397.9" y1="162.8" x2="362.6" y2="183.2" stroke="#C9971F" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
  <circle cx="356.7" cy="186.6" r="2.9" fill="#C9971F" opacity="0.75"/>
  <line x1="395.4" y1="156.6" x2="356.0" y2="167.2" stroke="#C9971F" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
  <circle cx="349.4" cy="168.9" r="2.9" fill="#C9971F" opacity="0.75"/>
  <line x1="394.5" y1="150.0" x2="353.7" y2="150.0" stroke="#C9971F" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
  <circle cx="346.9" cy="150.0" r="2.9" fill="#C9971F" opacity="0.75"/>
  <line x1="395.4" y1="143.4" x2="356.0" y2="132.8" stroke="#C9971F" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
  <circle cx="349.4" cy="131.1" r="2.9" fill="#C9971F" opacity="0.75"/>
  <line x1="397.9" y1="137.2" x2="362.6" y2="116.8" stroke="#C9971F" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
  <circle cx="356.7" cy="113.4" r="2.9" fill="#C9971F" opacity="0.75"/>
  <line x1="402.0" y1="132.0" x2="373.1" y2="103.1" stroke="#C9971F" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
  <circle cx="368.3" cy="98.3" r="2.9" fill="#C9971F" opacity="0.75"/>
  <line x1="407.2" y1="127.9" x2="386.8" y2="92.6" stroke="#C9971F" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
  <circle cx="383.4" cy="86.7" r="2.9" fill="#C9971F" opacity="0.75"/>
  <line x1="413.4" y1="125.4" x2="402.8" y2="86.0" stroke="#C9971F" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
  <circle cx="401.1" cy="79.4" r="2.9" fill="#C9971F" opacity="0.75"/>
  <circle cx="420" cy="150" r="18.7" fill="none" stroke="#C9971F" strokeWidth="2.2"/>
  <circle cx="420" cy="150" r="8.5" fill="#C9971F" opacity="0.9"/>
        <rect y="230" width="800" height="30" fill="var(--color-indigo-dark)" />
        <path d="M120.0,230.0 C116.4,208.0 121.5,188.0 131.4,183.0 C141.0,172.0 143.4,143.0 147.0,138.0 L150.0,130.0 L153.0,138.0 C156.6,143.0 159.0,172.0 168.6,183.0 C178.5,188.0 183.6,208.0 180.0,230.0 Z" fill="var(--color-laterite-dark)" />
      <ellipse fill="var(--color-gold)" cx="150.0" cy="137.0" rx="4.8" ry="1.8"/>
      <line stroke="var(--color-gold)" x1="150.0" y1="130.0" x2="150.0" y2="123.0" strokeWidth="2.4"/><circle fill="var(--color-gold)" cx="150.0" cy="121.0" r="1.8"/>
      <path d="M166.5,230.0 L188.1,188.0 L209.7,230.0 Z" fill="var(--color-laterite-dark)" opacity="0.92"/>
      <path d="M215.0,230.0 C209.6,193.7 217.2,160.7 232.1,152.4 C246.5,134.3 250.1,86.4 255.5,78.2 L260.0,65.0 L264.5,78.2 C269.9,86.4 273.5,134.3 287.9,152.4 C302.8,160.7 310.4,193.7 305.0,230.0 Z" fill="var(--color-laterite-dark)" />
      <ellipse fill="var(--color-gold)" cx="260.0" cy="76.5" rx="7.2" ry="3.0"/>
      <line stroke="var(--color-gold)" x1="260.0" y1="65.0" x2="260.0" y2="53.5" strokeWidth="2.4"/><circle fill="var(--color-gold)" cx="260.0" cy="50.1" r="3.0"/>
      <path d="M170.4,230.0 L202.8,160.7 L235.2,230.0 Z" fill="var(--color-laterite-dark)" opacity="0.92"/>
      <path d="M360.0,230.0 C352.8,183.8 363.0,141.8 382.8,131.3 C402.0,108.2 406.8,47.3 414.0,36.8 L420.0,20.0 L426.0,36.8 C433.2,47.3 438.0,108.2 457.2,131.3 C477.0,141.8 487.2,183.8 480.0,230.0 Z" fill="var(--color-laterite-dark)" />
      <ellipse fill="var(--color-gold)" cx="420.0" cy="34.7" rx="9.6" ry="3.8"/>
      <line stroke="var(--color-gold)" x1="420.0" y1="20.0" x2="420.0" y2="5.3" strokeWidth="2.4"/><circle fill="var(--color-gold)" cx="420.0" cy="1.1" r="3.8"/>
      <path d="M453.0,230.0 L496.2,141.8 L539.4,230.0 Z" fill="var(--color-laterite-dark)" opacity="0.92"/>
      <path d="M557.5,230.0 C552.4,197.0 559.6,167.0 573.6,159.5 C587.2,143.0 590.6,99.5 595.8,92.0 L600.0,80.0 L604.2,92.0 C609.4,99.5 612.8,143.0 626.4,159.5 C640.4,167.0 647.6,197.0 642.5,230.0 Z" fill="var(--color-laterite-dark)" />
      <ellipse fill="var(--color-gold)" cx="600.0" cy="90.5" rx="6.8" ry="2.7"/>
      <line stroke="var(--color-gold)" x1="600.0" y1="80.0" x2="600.0" y2="69.5" strokeWidth="2.4"/><circle fill="var(--color-gold)" cx="600.0" cy="66.5" r="2.7"/>
      <path d="M515.4,230.0 L546.0,167.0 L576.6,230.0 Z" fill="var(--color-laterite-dark)" opacity="0.92"/>
      <path d="M672.5,230.0 C669.2,209.1 673.9,190.1 683.0,185.3 C691.8,174.9 694.0,147.3 697.2,142.6 L700.0,135.0 L702.8,142.6 C706.0,147.3 708.2,174.9 717.0,185.3 C726.1,190.1 730.8,209.1 727.5,230.0 Z" fill="var(--color-laterite-dark)" />
      <ellipse fill="var(--color-gold)" cx="700.0" cy="141.7" rx="4.4" ry="1.7"/>
      <line stroke="var(--color-gold)" x1="700.0" y1="135.0" x2="700.0" y2="128.3" strokeWidth="2.4"/><circle fill="var(--color-gold)" cx="700.0" cy="126.5" r="1.7"/>
      <path d="M715.1,230.0 L734.9,190.1 L754.7,230.0 Z" fill="var(--color-laterite-dark)" opacity="0.92"/>
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          {children}
        </div>
      )}
    </div>
  );
}

