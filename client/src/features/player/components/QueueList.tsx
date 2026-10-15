import { X } from 'lucide-react';
import { Cover } from '../../../components/music/Cover';
import { PlayingBars } from '../../../components/music/PlayingBars';
import { IconButton } from '../../../components/ui/Button';
import { cn } from '../../../lib/cn';
import { formatTime } from '../../../lib/format';
import { type QueueItem, usePlayerStore } from '../player.store';

/** Danh sách chờ: bài đang phát + các bài tiếp theo (bấm để chuyển, X để xoá). */
export function QueueList({ className }: { className?: string }) {
  const queue = usePlayerStore((s) => s.queue);
  const index = usePlayerStore((s) => s.index);
  const context = usePlayerStore((s) => s.context);
  const clearUpcoming = usePlayerStore((s) => s.clearUpcoming);
  const current = queue[index];
  const upcoming = queue.slice(index + 1);

  return (
    <div className={className}>
      {current && (
        <>
          <h3 className="px-2 pb-2 text-sm font-bold tracking-wider text-muted uppercase">Đang phát</h3>
          <QueueRow item={current} isCurrent />
        </>
      )}
      <div className="mt-6 flex items-center justify-between px-2 pb-2">
        <h3 className="text-sm font-bold tracking-wider text-muted uppercase">
          Tiếp theo{context ? ` · ${context.label}` : ''}
        </h3>
        {upcoming.length > 0 && (
          <button type="button" onClick={clearUpcoming} className="text-sm font-semibold text-muted transition hover:text-text">
            Xoá tất cả
          </button>
        )}
      </div>
      {upcoming.length === 0 ? (
        <p className="px-2 py-6 text-center text-sm text-muted">Không còn bài nào trong danh sách chờ.</p>
      ) : (
        <div className="space-y-0.5">
          {upcoming.map((item) => (
            <QueueRow key={item.uid} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function QueueRow({ item, isCurrent = false }: { item: QueueItem; isCurrent?: boolean }) {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const jumpTo = usePlayerStore((s) => s.jumpTo);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const { song } = item;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => (isCurrent ? togglePlay() : jumpTo(item.uid))}
      onKeyDown={(e) => e.key === 'Enter' && (isCurrent ? togglePlay() : jumpTo(item.uid))}
      className={cn('flex items-center gap-3 rounded-2xl p-2 transition', isCurrent ? 'bg-white/10' : 'hover:bg-white/6')}
    >
      <div className="relative">
        <Cover src={song.coverUrl} alt={song.albumTitle} className="size-11" rounded="rounded-lg" />
        {isCurrent && (
          <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/45 text-accent">
            <PlayingBars playing={isPlaying} />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className={cn('truncate font-semibold', isCurrent && 'text-accent')}>{song.title}</div>
        <div className="truncate text-sm text-muted">{song.artistName}</div>
      </div>
      <span className="text-sm tabular-nums text-muted">{formatTime(song.durationSec)}</span>
      {!isCurrent && (
        <IconButton
          label={`Xoá ${song.title} khỏi danh sách chờ`}
          size="sm"
          className="text-muted hover:text-text"
          onClick={(e) => {
            e.stopPropagation();
            removeFromQueue(item.uid);
          }}
        >
          <X className="size-4" />
        </IconButton>
      )}
    </div>
  );
}
