import { SkipForward } from 'lucide-react';
import { Cover } from '../../../components/music/Cover';
import { LikeButton } from '../../../components/music/LikeButton';
import { IconButton } from '../../../components/ui/Button';
import { useOverlay } from '../../../hooks/useOverlay';
import { usePlayerStore, useCurrentSong } from '../player.store';
import { PlayPauseButton } from './PlayerControls';
import { ProgressLine } from './SeekBar';

/** Trình phát thu gọn nổi phía trên thanh điều hướng (điện thoại / máy tính bảng). */
export function MiniPlayer() {
  const song = useCurrentSong();
  const next = usePlayerStore((s) => s.next);
  const player = useOverlay('player');
  if (!song) return null;

  return (
    <div className="fixed inset-x-2.5 bottom-[calc(var(--nav-h)+var(--safe-bottom)+0.5rem)] z-40 lg:hidden">
      <div
        role="button"
        tabIndex={0}
        aria-label={`Mở trình phát: ${song.title}`}
        onClick={player.open}
        onKeyDown={(e) => e.key === 'Enter' && player.open()}
        className="glass-strong relative flex h-[var(--mini-h)] animate-slide-up items-center gap-3 overflow-hidden rounded-[1.25rem] pr-2 pl-2"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ background: `linear-gradient(90deg, ${song.mood.color}33, transparent 60%)` }}
        />
        <Cover src={song.coverUrl} alt={song.albumTitle} className="relative size-12" rounded="rounded-xl" eager />
        <div className="relative min-w-0 flex-1">
          <div className="truncate text-[0.95rem] font-semibold">{song.title}</div>
          <div className="truncate text-sm text-muted">{song.artistName}</div>
        </div>
        <LikeButton songId={song.id} className="relative" />
        <PlayPauseButton size="md" className="relative size-10" />
        <IconButton
          label="Bài tiếp theo"
          size="sm"
          className="relative hidden min-[380px]:inline-flex"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
        >
          <SkipForward className="size-5 fill-current" />
        </IconButton>
        <ProgressLine className="absolute inset-x-3 bottom-0 h-[2px]" />
      </div>
    </div>
  );
}
