export default function Card({ children, className = '', pattern = true, as: As = 'div', ...rest }) {
  return (
    <As
      className={`bg-white/80 rounded-md shadow-temple ${pattern ? 'pattachitra-frame' : 'border border-ink/10'} p-4 sm:p-5 ${className}`}
      {...rest}
    >
      {children}
    </As>
  );
}
