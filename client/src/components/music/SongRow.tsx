import type { Song } from '@nocturne/shared';
import { Ellipsis, Play } from 'lucide-react';
import type { KeyboardEvent, ReactNode } from 'react';
import { usePlayerStore } from '../../features/player/player.store';
import { type SongSheetContext, useUiStore } from '../../features/ui/ui.store';
import { cn } from '../../lib/cn';
import { formatTime } from '../../lib/format';
import { IconButton } from '../ui/Button';
import { Cover } from './Cover';
import { LikeButton } from './LikeButton';
import { MoodChip, MoodDot } from './MoodChip';
import { PlayingBars } from './PlayingBars';

interface SongRowProps {
  song: Song;
  /** Số thứ tự hiển thị (album/bảng xếp hạng). Bỏ trống để hiện ảnh bìa. */
  number?: number;
  showCover?: boolean;
  showAlbum?: boolean;
  showMood?: boolean;
  sheetContext?: SongSheetContext;
  onPlay: () => void;
  trailing?: ReactNode;
}

/**
 * Một dòng bài hát. Điện thoại: ảnh/số · tên + nghệ sĩ · nút "...".
 * Màn hình rộng: thêm cột tâm trạng, nút thích, thời lượng (giống thiết kế).
 */
export function SongRow({ song, number, showCover = false, showAlbum = false, showMood = true, sheetContext, onPlay, trailing }: SongRowProps) {
  const isCurrent = usePlayerStore((s) => s.queue[s.index]?.song.id === song.id);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const openSongSheet = useUiStore((s) => s.openSongSheet);

  const activate = () => (isCurrent ? togglePlay() : onPlay());
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${isCurrent && isPlaying ? 'Tạm dừng' : 'Phát'} ${song.title} — ${song.artistName}`}
      onClick={activate}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => {
        e.preventDefault();
        openSongSheet(song, sheetContext);
      }}
      className={cn(
        'group grid min-h-16 items-center gap-3 rounded-2xl px-2 py-2 transition sm:px-3',
        showMood
          ? 'grid-cols-[auto_minmax(0,1fr)_auto] md:grid-cols-[auto_minmax(0,1fr)_9.5rem_auto_3.25rem_auto] lg:grid-cols-[auto_minmax(0,1fr)_10.5rem_auto_3.25rem_auto]'
          : 'grid-cols-[auto_minmax(0,1fr)_auto] md:grid-cols-[auto_minmax(0,1fr)_auto_3.25rem_auto]',
        isCurrent ? 'bg-white/[0.11]' : 'hover:bg-white/[0.05] active:bg-white/[0.08]',
      )}
    >
      {/* Cột 1: số thứ tự hoặc ảnh bìa */}
      {showCover ? (
        <div className="relative">
          <Cover src={song.coverUrl} alt={song.albumTitle} className="size-12" rounded="rounded-xl" />
          {isCurrent && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/45 text-accent">
              <PlayingBars playing={isPlaying} />
            </div>
          )}
        </div>
      ) : (
        <div className="flex w-8 items-center justify-center text-[0.95rem] font-semibold tabular-nums text-muted">
          {isCurrent ? (
            <PlayingBars playing={isPlaying} className="text-accent" />
          ) : (
            <>
              <span className="group-hover:hidden">{number}</span>
              <Play className="hidden size-4 fill-current text-text group-hover:block" />
            </>
          )}
        </div>
      )}

      {/* Cột 2: tên bài + nghệ sĩ */}
      <div className="min-w-0">
        <div className={cn('truncate text-[0.98rem] font-semibold', isCurrent ? 'text-accent' : 'text-text')}>{song.title}</div>
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-sm text-muted">
          {showMood && <MoodDot color={song.mood.color} className="md:hidden" />}
          <span className="truncate">
            {song.artistName}
            {showAlbum && ` · ${song.albumTitle}`}
          </span>
        </div>
      </div>

      {/* Màn hình rộng: tâm trạng, thích, thời lượng */}
      {showMood && (
        <div className="hidden md:block">
          <MoodChip mood={song.mood} />
        </div>
      )}
      <div className="hidden md:block">
        <LikeButton songId={song.id} />
      </div>
      <div className="hidden text-right text-[0.95rem] tabular-nums text-muted md:block">{formatTime(song.durationSec)}</div>

      <div className="flex items-center">
        {trailing}
        <IconButton
          label={`Tuỳ chọn cho ${song.title}`}
          size="sm"
          className="text-muted hover:text-text"
          onClick={(e) => {
            e.stopPropagation();
            openSongSheet(song, sheetContext);
          }}
        >
          <Ellipsis className="size-5" />
        </IconButton>
      </div>
    </div>
  );
}
