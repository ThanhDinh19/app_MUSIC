import type { MoodShare } from '@nocturne/shared';
import { cn } from '../../lib/cn';

/** Thẻ "Tâm trạng của album" — thanh màu theo tỉ lệ thời lượng + chú thích. */
export function MoodBreakdownCard({ title, shares, className }: { title: string; shares: MoodShare[]; className?: string }) {
  if (shares.length === 0) return null;
  return (
    <section className={cn('glass rounded-panel p-6 sm:p-7', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold">{title}</h2>
        <span className="text-sm text-muted">Theo thời lượng</span>
      </div>
      <div className="mt-4 flex h-3 gap-[3px] overflow-hidden rounded-full" role="img" aria-label={shares.map((s) => `${s.name} ${s.percent}%`).join(', ')}>
        {shares.map((s) => (
          <span key={s.moodId} className="h-full first:rounded-l-full last:rounded-r-full" style={{ flexGrow: s.durationSec, background: s.color }} />
        ))}
      </div>
      <ul className="mt-5 space-y-3">
        {shares.slice(0, 4).map((s) => (
          <li key={s.moodId} className="flex items-center gap-3 text-[0.95rem]">
            <span className="size-2.5 rounded-full" style={{ background: s.color }} />
            <span className="flex-1 font-medium">{s.name}</span>
            <span className="tabular-nums text-muted">{s.percent}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
