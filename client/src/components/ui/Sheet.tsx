import { X } from 'lucide-react';
import { type ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';
import { IconButton } from './Button';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Ẩn tiêu đề trực quan nhưng vẫn giữ cho trình đọc màn hình. */
  hideHeader?: boolean;
}

let openSheets = 0;

/** Bảng trượt từ dưới lên (điện thoại) / hộp thoại giữa màn hình (máy tính). */
export function Sheet({ open, onClose, title, children, className, hideHeader }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    openSheets++;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    requestAnimationFrame(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>('[data-autofocus], input, textarea, button:not([data-close])');
      (focusable ?? panelRef.current)?.focus({ preventScroll: true });
    });
    return () => {
      window.removeEventListener('keydown', onKey);
      openSheets--;
      if (openSheets === 0) document.body.style.overflow = '';
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-black/55 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        data-sheet
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          'glass-strong relative max-h-[88dvh] w-full animate-sheet-up overflow-y-auto overscroll-contain rounded-t-[1.75rem] pb-[calc(var(--safe-bottom)+1rem)] outline-none sm:max-w-md sm:animate-slide-up sm:rounded-[1.75rem] sm:pb-4',
          className,
        )}
      >
        <div className="sticky top-0 z-10 flex justify-center pt-2.5 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-white/25" />
        </div>
        {title && (
          <div className={cn('flex items-center justify-between gap-3 px-5 pt-3 pb-2 sm:pt-5', hideHeader && 'sr-only')}>
            <h2 id={titleId} className="text-lg font-bold">
              {title}
            </h2>
            <IconButton label="Đóng" size="sm" onClick={onClose} data-close>
              <X className="size-5" />
            </IconButton>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

interface SheetActionProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
  active?: boolean;
}

export function SheetAction({ icon, label, onClick, tone = 'default', active }: SheetActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-4 px-5 py-3.5 text-left text-[0.95rem] font-medium transition hover:bg-white/6 active:bg-white/10',
        tone === 'danger' ? 'text-danger' : active ? 'text-accent' : 'text-text',
      )}
    >
      <span className="flex size-6 items-center justify-center opacity-90">{icon}</span>
      {label}
    </button>
  );
}
