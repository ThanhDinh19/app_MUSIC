import { RefreshCw, TriangleAlert } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { errorMessage } from '../../lib/api';
import { cn } from '../../lib/cn';
import { Button } from './Button';

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn('animate-pulse rounded-2xl bg-white/[0.07]', className)} style={style} />;
}

export function EmptyState({ icon, title, description, action, className }: { icon: ReactNode; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-14 text-center', className)}>
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-white/8 text-muted">{icon}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={<TriangleAlert className="size-7 text-danger" />}
      title="Không tải được nội dung"
      description={errorMessage(error)}
      action={
        onRetry && (
          <Button onClick={onRetry} icon={<RefreshCw className="size-4" />}>
            Thử lại
          </Button>
        )
      }
    />
  );
}

/** Khung xương khi trang đang tải. */
export function PageSkeleton() {
  return (
    <div className="space-y-8 pt-4">
      <div className="flex flex-col items-center gap-5 md:flex-row md:items-end">
        <Skeleton className="size-56 rounded-[1.75rem]" />
        <div className="flex w-full flex-col items-center gap-3 md:items-start">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-3/4 max-w-md" />
          <Skeleton className="h-4 w-1/2 max-w-xs" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
