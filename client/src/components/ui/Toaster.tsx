import { CircleCheck, TriangleAlert } from 'lucide-react';
import { usePlayerStore } from '../../features/player/player.store';
import { useToastStore } from '../../features/ui/toast.store';
import { cn } from '../../lib/cn';

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const hasPlayer = usePlayerStore((s) => s.queue.length > 0);

  return (
    <div
      aria-live="polite"
      className={cn(
        'pointer-events-none fixed inset-x-0 z-[80] flex flex-col items-center gap-2 px-4',
        hasPlayer
          ? 'bottom-[calc(var(--nav-h)+var(--mini-h)+var(--safe-bottom)+1.25rem)] lg:bottom-[calc(var(--bar-h)+1rem)]'
          : 'bottom-[calc(var(--nav-h)+var(--safe-bottom)+1rem)] lg:bottom-6',
      )}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="glass-strong pointer-events-auto flex w-full max-w-sm animate-slide-up items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium"
        >
          {t.tone === 'error' ? <TriangleAlert className="size-5 shrink-0 text-danger" /> : <CircleCheck className="size-5 shrink-0 text-accent" />}
          <span className="min-w-0 flex-1">{t.message}</span>
          {t.action && (
            <button
              type="button"
              className="shrink-0 font-bold text-accent"
              onClick={() => {
                t.action?.onClick();
                dismiss(t.id);
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
