import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { cn } from '../../../lib/cn';
import { formatTime } from '../../../lib/format';
import { usePlayerStore } from '../player.store';
import { useProgressStore } from '../progress.store';

/** Thanh tua: kéo để xem trước thời điểm, thả tay mới tua thật (tránh giật tiếng). */
export function SeekBar({ className, compact = false }: { className?: string; compact?: boolean }) {
  const currentTime = useProgressStore((s) => s.currentTime);
  const duration = useProgressStore((s) => s.duration);
  const seek = usePlayerStore((s) => s.seek);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);
  dragRef.current = dragValue;
  const dragging = dragValue !== null;

  useEffect(() => {
    if (!dragging) return;
    const commit = () => {
      if (dragRef.current !== null) seek(dragRef.current);
      setDragValue(null);
    };
    window.addEventListener('pointerup', commit);
    window.addEventListener('pointercancel', commit);
    return () => {
      window.removeEventListener('pointerup', commit);
      window.removeEventListener('pointercancel', commit);
    };
  }, [dragging, seek]);

  const value = dragValue ?? currentTime;
  const max = duration > 0 ? duration : 1;
  const progress = `${Math.min(100, (value / max) * 100)}%`;

  return (
    <div className={cn('w-full', className)}>
      <input
        type="range"
        className="range"
        aria-label="Tua bài hát"
        aria-valuetext={`${formatTime(value)} / ${formatTime(duration)}`}
        min={0}
        max={max}
        step={0.1}
        value={value}
        style={{ '--progress': progress } as CSSProperties}
        onPointerDown={() => setDragValue(currentTime)}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (dragRef.current !== null) setDragValue(v);
          else seek(v);
        }}
      />
      <div className={cn('flex justify-between text-xs font-medium tabular-nums text-muted', compact ? 'mt-0' : 'mt-1')}>
        <span>{formatTime(value)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

/** Vạch tiến độ mỏng (mini player). */
export function ProgressLine({ className }: { className?: string }) {
  const currentTime = useProgressStore((s) => s.currentTime);
  const duration = useProgressStore((s) => s.duration);
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  return (
    <div className={cn('h-[3px] overflow-hidden rounded-full bg-white/12', className)}>
      <div className="h-full rounded-full bg-white transition-[width] duration-300 ease-linear" style={{ width: `${pct}%` }} />
    </div>
  );
}
