import KonarkWheel from './KonarkWheel.jsx';

export default function LoadingScreen({ label = 'Calculating…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <KonarkWheel size={72} spin color="var(--color-gold)" ariaLabel="Loading" />
      <p className="font-display text-indigo/80 tracking-wide">{label}</p>
    </div>
  );
}
