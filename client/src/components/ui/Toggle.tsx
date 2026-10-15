import { cn } from '../../lib/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}

/** Công tắc bật/tắt (giống "Mood sync" trong thiết kế). */
export function Toggle({ checked, onChange, label, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300',
        checked ? 'bg-accent-strong shadow-[0_0_18px_-2px_rgb(92_200_240/0.7)]' : 'bg-white/18',
        className,
      )}
    >
      <span
        className={cn(
          'inline-block size-5 rounded-full bg-white shadow transition-transform duration-300',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  );
}
