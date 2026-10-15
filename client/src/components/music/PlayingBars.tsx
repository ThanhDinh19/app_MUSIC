import { cn } from '../../lib/cn';

/** Biểu tượng sóng nhạc nhảy theo nhịp khi bài đang phát. */
export function PlayingBars({ playing, className }: { playing: boolean; className?: string }) {
  return (
    <span className={cn('eq', !playing && 'paused', className)} aria-label={playing ? 'Đang phát' : 'Tạm dừng'}>
      <i />
      <i />
      <i />
    </span>
  );
}
