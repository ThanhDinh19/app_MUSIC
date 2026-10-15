import type { MoodTag } from '@nocturne/shared';
import { Link } from 'react-router';
import { cn } from '../../lib/cn';

interface MoodChipProps {
  mood: MoodTag;
  size?: 'sm' | 'md';
  link?: boolean;
  className?: string;
}

/** Chip tâm trạng: chấm màu + tên (như "● Late night" trong thiết kế). */
export function MoodChip({ mood, size = 'md', link = false, className }: MoodChipProps) {
  const classes = cn(
    'inline-flex shrink-0 items-center gap-2 rounded-full border border-white/8 bg-[#0a0d22]/55 font-semibold whitespace-nowrap',
    size === 'md' ? 'h-9 px-3.5 text-sm' : 'h-7 px-2.5 text-xs',
    link && 'transition hover:border-white/20 hover:bg-[#0a0d22]/75',
    className,
  );
  const content = (
    <>
      <span className={cn('rounded-full', size === 'md' ? 'size-2.5' : 'size-2')} style={{ background: mood.color, boxShadow: `0 0 10px ${mood.color}` }} />
      {mood.name}
    </>
  );
  if (link) {
    return (
      <Link to={`/mood/${mood.id}`} className={classes} onClick={(e) => e.stopPropagation()}>
        {content}
      </Link>
    );
  }
  return <span className={classes}>{content}</span>;
}

export function MoodDot({ color, className }: { color: string; className?: string }) {
  return <span className={cn('inline-block size-2 shrink-0 rounded-full', className)} style={{ background: color }} />;
}
