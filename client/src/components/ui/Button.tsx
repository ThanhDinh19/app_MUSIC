import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'glass' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-white text-ink hover:bg-white/90 shadow-[0_10px_30px_-10px_rgb(255_255_255/0.45)]',
  glass: 'bg-white/10 text-text border border-white/12 hover:bg-white/16',
  ghost: 'text-muted hover:text-text hover:bg-white/8',
  danger: 'bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
}

export function Button({ variant = 'glass', size = 'md', icon, className, children, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold transition duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
        size === 'sm' && 'h-9 px-4 text-sm',
        size === 'md' && 'h-11 px-5 text-[0.95rem]',
        size === 'lg' && 'h-14 px-8 text-base',
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'glass' | 'ghost' | 'primary';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  active?: boolean;
}

export function IconButton({ label, variant = 'ghost', size = 'md', active, className, children, type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full transition duration-200 active:scale-90 disabled:pointer-events-none disabled:opacity-40',
        size === 'sm' && 'size-9',
        size === 'md' && 'size-11',
        size === 'lg' && 'size-14',
        size === 'xl' && 'size-[4.5rem]',
        variant === 'glass' && 'border border-white/14 bg-white/10 hover:bg-white/18',
        variant === 'ghost' && 'hover:bg-white/10',
        variant === 'primary' && 'bg-white text-ink hover:bg-white/90',
        active ? 'text-accent' : variant !== 'primary' && 'text-text/90',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
