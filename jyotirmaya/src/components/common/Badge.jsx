const TONES = {
  gold: 'bg-gold/15 text-gold-dark border-gold/40',
  laterite: 'bg-laterite/10 text-laterite border-laterite/35',
  indigo: 'bg-indigo/10 text-indigo border-indigo/30',
  teal: 'bg-teal/10 text-teal border-teal/35',
  neutral: 'bg-ink/5 text-ink/70 border-ink/15',
  success: 'bg-teal/10 text-teal border-teal/35',
  warn: 'bg-gold/15 text-gold-dark border-gold/40',
  danger: 'bg-laterite/10 text-laterite border-laterite/35',
};

export default function Badge({ children, tone = 'neutral', className = '', title }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${TONES[tone] || TONES.neutral} ${className}`}>
      {children}
    </span>
  );
}
