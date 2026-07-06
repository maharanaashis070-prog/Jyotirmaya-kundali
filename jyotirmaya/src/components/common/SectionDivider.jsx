import KonarkWheel from './KonarkWheel.jsx';

export default function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 my-6" role="separator">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/50 to-gold/50" />
      <KonarkWheel size={22} color="var(--color-gold)" />
      {label && <span className="font-display text-xs tracking-[0.2em] uppercase text-indigo/70">{label}</span>}
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gold/50 to-gold/50" />
    </div>
  );
}
