import type { AlbumDetail } from '@nocturne/shared';
import { Ellipsis, Heart, ListEnd, Share2, User } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useLibraryIds, useToggleSaveAlbum } from '../../api/me';
import { usePlayerStore } from '../../features/player/player.store';
import { toast } from '../../features/ui/toast.store';
import { cn } from '../../lib/cn';
import { ALBUM_TYPE_LABEL, formatDuration } from '../../lib/format';
import { IconButton } from '../ui/Button';
import { Sheet, SheetAction } from '../ui/Sheet';
import { ArtistSpotlight } from './ArtistSpotlight';
import { Cover } from './Cover';
import { HERO_ICON, MediaHero, MetaDot, PlayActions } from './MediaHero';
import { MoodBreakdownCard } from './MoodBreakdownCard';
import { MoodChip } from './MoodChip';
import { SongList } from './SongList';

/**
 * Bố cục album theo thiết kế: khung kính lớn (bìa, tiêu đề, nút, danh sách bài)
 * + cột phải gồm "Tâm trạng của album" và thẻ nghệ sĩ.
 */
export function AlbumPanel({ detail, eyebrow, songLimit }: { detail: AlbumDetail; eyebrow?: string; songLimit?: number }) {
  const { album, artist, songs, moodBreakdown } = detail;
  const { data: ids } = useLibraryIds();
  const toggleSave = useToggleSaveAlbum();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const saved = ids?.savedAlbumIds.includes(album.id) ?? false;
  const context = { type: 'album' as const, id: album.id, label: album.title };
  const visible = songLimit ? songs.slice(0, songLimit) : songs;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] xl:gap-8">
      <section className="glass rounded-panel px-4 py-7 sm:p-8 lg:p-10">
        <MediaHero
          cover={<Cover src={album.coverUrl} alt={album.title} rounded="rounded-[1.75rem]" eager className="w-full shadow-[0_30px_60px_-25px_rgb(0_0_0/0.85)]" />}
          eyebrow={eyebrow ?? ALBUM_TYPE_LABEL[album.type]}
          chip={<MoodChip mood={album.mood} link />}
          title={album.title}
          meta={
            <>
              <Link to={`/artist/${artist.id}`} className="inline-flex items-center gap-2 font-bold text-text hover:underline">
                <img src={artist.imageUrl} alt="" className="size-8 rounded-full object-cover" />
                {artist.name}
              </Link>
              <MetaDot />
              <span>{album.year}</span>
              <MetaDot />
              <span>{album.songCount} bài hát</span>
              <MetaDot />
              <span>{formatDuration(album.totalDurationSec)}</span>
            </>
          }
          actions={
            <PlayActions songs={songs} context={context}>
              <IconButton
                label={saved ? 'Xoá khỏi Thư viện' : 'Lưu vào Thư viện'}
                variant="glass"
                size="md"
                className={HERO_ICON}
                active={saved}
                onClick={() => toggleSave.mutate({ id: album.id, on: !saved })}
              >
                <Heart className={cn('size-5', saved && 'fill-current')} />
              </IconButton>
              <IconButton label="Tuỳ chọn album" variant="glass" size="md" className={HERO_ICON} onClick={() => setOptionsOpen(true)}>
                <Ellipsis className="size-5" />
              </IconButton>
            </PlayActions>
          }
        />

        <SongList songs={visible} context={context} numbered header className="mt-9" />

        {songLimit && songs.length > songLimit && (
          <Link to={`/album/${album.id}`} className="mt-4 inline-block px-3 text-sm font-semibold text-muted hover:text-text">
            Xem toàn bộ {songs.length} bài hát →
          </Link>
        )}
        {!songLimit && album.description && <p className="mt-8 px-3 text-sm leading-relaxed text-muted">{album.description}</p>}
      </section>

      <aside className="space-y-6">
        <MoodBreakdownCard title="Tâm trạng của album" shares={moodBreakdown} />
        <ArtistSpotlight artist={artist} />
      </aside>

      <AlbumOptionsSheet open={optionsOpen} onClose={() => setOptionsOpen(false)} detail={detail} />
    </div>
  );
}

function AlbumOptionsSheet({ open, onClose, detail }: { open: boolean; onClose: () => void; detail: AlbumDetail }) {
  const navigate = useNavigate();
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const { album, artist, songs } = detail;

  const share = async () => {
    const url = new URL(`/album/${album.id}`, window.location.origin).href;
    try {
      if (navigator.share) await navigator.share({ title: album.title, text: `${album.title} — ${artist.name}`, url });
      else {
        await navigator.clipboard.writeText(url);
        toast('Đã sao chép liên kết');
      }
    } catch {
      /* người dùng huỷ chia sẻ */
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={album.title}>
      <div className="pb-2">
        <SheetAction
          icon={<ListEnd className="size-5" />}
          label="Thêm cả album vào danh sách chờ"
          onClick={() => {
            songs.forEach((song) => addToQueue(song));
            toast(`Đã thêm ${songs.length} bài vào danh sách chờ`);
            onClose();
          }}
        />
        <SheetAction
          icon={<User className="size-5" />}
          label={`Xem ${artist.name}`}
          onClick={() => {
            onClose();
            navigate(`/artist/${artist.id}`);
          }}
        />
        <SheetAction
          icon={<Share2 className="size-5" />}
          label="Chia sẻ album"
          onClick={() => {
            onClose();
            void share();
          }}
        />
      </div>
    </Sheet>
  );
}
