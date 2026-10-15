import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '../../lib/cn';

interface SectionProps {
  title: string;
  subtitle?: string;
  moreTo?: string;
  moreLabel?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Section({ title, subtitle, moreTo, moreLabel = 'Xem tất cả', action, children, className }: SectionProps) {
  return (
    <section className={cn('mt-9 first:mt-0', className)}>
      <div className="mb-3.5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight sm:text-[1.4rem]">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
        {action}
        {moreTo && (
          <Link to={moreTo} className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-muted transition hover:text-text">
            {moreLabel}
            <ChevronRight className="size-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Hàng cuộn ngang (snap) — tràn ra sát mép màn hình trên điện thoại. */
export function Scroller({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-2 lg:px-2',
        className,
      )}
    >
      {children}
    </div>
  );
}
