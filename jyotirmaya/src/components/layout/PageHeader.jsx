export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        {title && (
          <>
            <h1 className="font-display text-2xl sm:text-3xl text-indigo">{title}</h1>
            <div className="h-[3px] w-14 mt-1.5 rounded-full bg-gradient-to-r from-gold via-marigold to-transparent" />
          </>
        )}
        {subtitle && <p className={`text-sm text-ink/60 max-w-xl ${title ? 'mt-2' : ''}`}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
