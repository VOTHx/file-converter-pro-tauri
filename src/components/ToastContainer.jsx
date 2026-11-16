import { CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '../hooks/useToast.jsx';

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2.5rem)]">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-semibold cursor-pointer bg-white dark:bg-neutral-900 border ${
            t.type === 'error' ? 'border-red-500/40 text-red-500' : 'border-accent/40 text-accent'
          }`}
        >
          {t.type === 'error' ? <XCircle size={16} className="shrink-0" /> : <CheckCircle2 size={16} className="shrink-0" />}
          <span className="flex-1 text-neutral-900 dark:text-neutral-100">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
