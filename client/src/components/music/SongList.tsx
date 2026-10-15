import type { Song } from '@nocturne/shared';
import { Clock } from 'lucide-react';
import { type PlayContext, usePlayerStore } from '../../features/player/player.store';
import { cn } from '../../lib/cn';
import { SongRow } from './SongRow';

interface SongListProps {
  songs: Song[];
  context: PlayContext;
  numbered?: boolean;
  showAlbum?: boolean;
  showMood?: boolean;
  header?: boolean;
  playlistId?: string;
  className?: string;
  /** Class cho vùng chứa các dòng (vd. chia 2 cột trên màn hình rộng). */
  listClassName?: string;
}

/** Danh sách bài hát: bấm một bài sẽ phát cả danh sách bắt đầu từ bài đó. */
export function SongList({ songs, context, numbered = false, showAlbum = false, showMood = true, header = false, playlistId, className, listClassName }: SongListProps) {
  const playSongs = usePlayerStore((s) => s.playSongs);

  return (
    <div className={className}>
      {header && (
        <div
          className={cn(
            'hidden items-center gap-3 border-b border-line px-3 pb-3 text-sm font-medium text-faint md:grid',
            showMood
              ? 'md:grid-cols-[auto_minmax(0,1fr)_9.5rem_auto_3.25rem_auto] lg:grid-cols-[auto_minmax(0,1fr)_10.5rem_auto_3.25rem_auto]'
              : 'md:grid-cols-[auto_minmax(0,1fr)_auto_3.25rem_auto]',
          )}
        >
          <span className="w-8 text-center">#</span>
          <span>Tiêu đề</span>
          {showMood && <span>Tâm trạng</span>}
          <span className="w-9" />
          <span className="flex justify-end">
            <Clock className="size-4" aria-label="Thời lượng" />
          </span>
          <span className="w-9" />
        </div>
      )}
      <div className={cn('space-y-0.5', header && 'md:mt-3', listClassName)}>
        {songs.map((song, i) => (
          <SongRow
            key={`${song.id}-${i}`}
            song={song}
            number={i + 1}
            showCover={!numbered}
            showAlbum={showAlbum}
            showMood={showMood}
            sheetContext={playlistId ? { playlistId } : undefined}
            onPlay={() => playSongs(songs, i, context)}
          />
        ))}
      </div>
    </div>
  );
}
