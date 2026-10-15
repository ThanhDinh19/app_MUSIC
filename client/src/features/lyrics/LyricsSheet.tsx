import type { Song } from '@nocturne/shared';
import { Play } from 'lucide-react';
import { Cover } from '../../components/music/Cover';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import { usePlayerStore } from '../player/player.store';
import { useUiStore } from '../ui/ui.store';
import { LyricsView } from './LyricsView';

/** Bảng xem lời của một bài bất kỳ (mở từ menu "..." hoặc kết quả tìm theo lời). */
export function LyricsSheet() {
  const song = useUiStore((s) => s.lyricsSheetSong);
  const close = useUiStore((s) => s.closeLyricsSheet);
  if (!song) return null;
  return <LyricsSheetContent key={song.id} song={song} onClose={close} />;
}

function LyricsSheetContent({ song, onClose }: { song: Song; onClose: () => void }) {
  const isCurrent = usePlayerStore((s) => s.queue[s.index]?.song.id === song.id);
  const playSongs = usePlayerStore((s) => s.playSongs);

  return (
    <Sheet open onClose={onClose} title="Lời bài hát" className="sm:max-w-lg">
      <div className="flex items-center gap-4 px-5 pb-4">
        <Cover src={song.coverUrl} alt={song.albumTitle} className="size-14" rounded="rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-bold">{song.title}</div>
          <div className="truncate text-sm text-muted">{song.artistName}</div>
        </div>
        {!isCurrent && (
          <Button variant="primary" size="sm" icon={<Play className="size-4 fill-current" />} onClick={() => playSongs([song], 0, { type: 'queue', label: song.title })}>
            Phát
          </Button>
        )}
      </div>
      <LyricsView song={song} variant="sheet" className="max-h-[55dvh] border-t border-line px-5 pt-3" />
    </Sheet>
  );
}
