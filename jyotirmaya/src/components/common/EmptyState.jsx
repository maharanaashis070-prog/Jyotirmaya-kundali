import KonarkWheel from './KonarkWheel.jsx';

export default function EmptyState({ title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
      <KonarkWheel size={56} color="var(--color-indigo)" opacity={0.35} />
      <h3 className="font-display text-lg text-indigo">{title}</h3>
      {subtitle && <p className="text-sm text-ink/60 max-w-sm">{subtitle}</p>}
      {action}
    </div>
  );
}
