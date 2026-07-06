import { AlertTriangle } from 'lucide-react';

export default function ErrorBanner({ title = 'Something needs attention', message, onRetry }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-laterite/40 bg-laterite/5 p-4">
      <AlertTriangle className="text-laterite shrink-0 mt-0.5" size={20} />
      <div className="flex-1">
        <p className="font-medium text-laterite">{title}</p>
        {message && <p className="text-sm text-ink/70 mt-1">{message}</p>}
      </div>
      {onRetry && (
        <button onClick={onRetry} className="text-sm font-medium text-laterite underline underline-offset-2 shrink-0">
          Retry
        </button>
      )}
    </div>
  );
}
