import { ListMusic, Maximize2, MicVocal } from 'lucide-react';
import { Link } from 'react-router';
import { Cover } from '../../../components/music/Cover';
import { LikeButton } from '../../../components/music/LikeButton';
import { IconButton } from '../../../components/ui/Button';
import { useOverlay } from '../../../hooks/useOverlay';
import { useUiStore } from '../../ui/ui.store';
import { useCurrentSong } from '../player.store';
import { PlayerControls, VolumeControl } from './PlayerControls';
import { SeekBar } from './SeekBar';

/** Thanh trình phát cố định phía dưới (màn hình rộng). */
export function PlayerBar() {
  const song = useCurrentSong();
  const player = useOverlay('player');
  const setLyricsOpen = useUiStore((s) => s.setLyricsOpen);
  if (!song) return null;

  return (
    <div className="glass-strong fixed inset-x-0 bottom-0 z-40 hidden h-[var(--bar-h)] rounded-none border-x-0 border-b-0 lg:block">
      <div className="mx-auto grid h-full max-w-[1440px] grid-cols-[1fr_minmax(0,36rem)_1fr] items-center gap-6 px-6">
        <div className="flex min-w-0 items-center gap-3.5">
          <button type="button" onClick={player.open} aria-label="Mở trình phát" className="shrink-0">
            <Cover src={song.coverUrl} alt={song.albumTitle} className="size-14" rounded="rounded-xl" eager />
          </button>
          <div className="min-w-0">
            <Link to={`/album/${song.albumId}`} className="block truncate font-semibold hover:underline">
              {song.title}
            </Link>
            <Link to={`/artist/${song.artistId}`} className="block truncate text-sm text-muted hover:text-text hover:underline">
              {song.artistName}
            </Link>
          </div>
          <LikeButton songId={song.id} />
        </div>

        <div className="flex flex-col gap-0.5">
          <PlayerControls size="bar" />
          <SeekBar compact />
        </div>

        <div className="flex items-center justify-end gap-2">
          <IconButton
            label="Lời bài hát"
            size="sm"
            onClick={() => {
              setLyricsOpen(true);
              player.open();
            }}
          >
            <MicVocal className="size-5" />
          </IconButton>
          <IconButton
            label="Danh sách chờ"
            size="sm"
            onClick={() => {
              setLyricsOpen(false);
              player.open();
            }}
          >
            <ListMusic className="size-5" />
          </IconButton>
          <VolumeControl />
          <IconButton label="Mở rộng trình phát" size="sm" onClick={player.open}>
            <Maximize2 className="size-[1.1rem]" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
