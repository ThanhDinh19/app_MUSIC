import type { Song } from '@nocturne/shared';
import { ArrowDown, ArrowUp, ListOrdered, Music2, Pencil, Trash } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { usePlaylist } from '../api/catalog';
import { useDeletePlaylist, useMe, useReorderPlaylist } from '../api/me';
import { Cover, PlaylistCover } from '../components/music/Cover';
import { HERO_ICON, MediaHero, MetaDot, PlayActions } from '../components/music/MediaHero';
import { MoodBreakdownCard } from '../components/music/MoodBreakdownCard';
import { SongList } from '../components/music/SongList';
import { Button, IconButton } from '../components/ui/Button';
import { Sheet } from '../components/ui/Sheet';
import { EmptyState, ErrorState, PageSkeleton } from '../components/ui/States';
import { useUiStore } from '../features/ui/ui.store';
import { formatDuration } from '../lib/format';

export default function PlaylistPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = usePlaylist(id);
  const { data: me } = useMe();
  const openPlaylistForm = useUiStore((s) => s.openPlaylistForm);
  const deletePlaylist = useDeletePlaylist();
  const [reordering, setReordering] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) return <PageSkeleton />;
  if (error || !data) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const { playlist, songs, moodBreakdown } = data;
  const isOwner = !!me && playlist.ownerId === me.id;
  const context = { type: 'playlist' as const, id: playlist.id, label: playlist.name };

  return (
    <div className="grid animate-fade-in items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] xl:gap-8">
      <section className="glass rounded-panel px-4 py-7 sm:p-8 lg:p-10">
        <MediaHero
          cover={<PlaylistCover coverUrl={playlist.coverUrl} previewCovers={playlist.previewCovers} name={playlist.name} rounded="rounded-[1.75rem]" className="w-full shadow-[0_30px_60px_-25px_rgb(0_0_0/0.85)]" />}
          eyebrow={playlist.isEditorial ? 'Playlist biên tập' : 'Playlist'}
          title={playlist.name}
          description={playlist.description || undefined}
          meta={
            <>
              <span className="font-bold text-text">{playlist.ownerName}</span>
              <MetaDot />
              <span>{playlist.songCount} bài hát</span>
              {playlist.totalDurationSec > 0 && (
                <>
                  <MetaDot />
                  <span>{formatDuration(playlist.totalDurationSec)}</span>
                </>
              )}
            </>
          }
          actions={
            <PlayActions songs={songs} context={context}>
              {isOwner && (
                <>
                  <IconButton label="Sửa playlist" variant="glass" size="md" className={HERO_ICON} onClick={() => openPlaylistForm({ mode: 'edit', playlist })}>
                    <Pencil className="size-5" />
                  </IconButton>
                  {songs.length > 1 && (
                    <IconButton label="Sắp xếp bài hát" variant="glass" size="md" className={HERO_ICON} active={reordering} onClick={() => setReordering((v) => !v)}>
                      <ListOrdered className="size-5" />
                    </IconButton>
                  )}
                  <IconButton label="Xoá playlist" variant="glass" size="md" className={HERO_ICON} onClick={() => setConfirmDelete(true)}>
                    <Trash className="size-5" />
                  </IconButton>
                </>
              )}
            </PlayActions>
          }
        />

        <div className="mt-9">
          {songs.length === 0 ? (
            <EmptyState
              icon={<Music2 className="size-7" />}
              title="Playlist chưa có bài nào"
              description="Nhấn “...” ở bất kỳ bài hát nào rồi chọn “Thêm vào playlist”."
              action={
                <Link to="/search">
                  <Button variant="primary">Tìm bài hát</Button>
                </Link>
              }
            />
          ) : reordering ? (
            <ReorderList playlistId={playlist.id} songs={songs} onDone={() => setReordering(false)} />
          ) : (
            <SongList songs={songs} context={context} numbered header showAlbum playlistId={isOwner ? playlist.id : undefined} />
          )}
        </div>
      </section>

      <aside className="space-y-6">
        <MoodBreakdownCard title="Tâm trạng của playlist" shares={moodBreakdown} />
      </aside>

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Xoá playlist?">
        <div className="px-5 pb-2">
          <p className="text-muted">
            Playlist “{playlist.name}” sẽ bị xoá vĩnh viễn. Các bài hát vẫn còn trong thư viện nhạc.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Huỷ
            </Button>
            <Button
              variant="danger"
              disabled={deletePlaylist.isPending}
              onClick={() => deletePlaylist.mutate(playlist.id, { onSuccess: () => navigate('/library', { replace: true }) })}
            >
              Xoá playlist
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

/** Chế độ sắp xếp: di chuyển bài lên/xuống rồi lưu. */
function ReorderList({ playlistId, songs, onDone }: { playlistId: string; songs: Song[]; onDone: () => void }) {
  const [order, setOrder] = useState(songs);
  const reorder = useReorderPlaylist();
  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    setOrder(next);
  };
  const save = () => {
    const changed = order.some((s, i) => s.id !== songs[i]?.id);
    if (!changed) return onDone();
    reorder.mutate({ playlistId, songIds: order.map((s) => s.id) }, { onSuccess: onDone });
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3 px-2">
        <p className="text-sm text-muted">Dùng mũi tên để đổi thứ tự bài hát.</p>
        <Button variant="primary" size="sm" onClick={save} disabled={reorder.isPending}>
          Xong
        </Button>
      </div>
      <ol className="space-y-1">
        {order.map((song, i) => (
          <li key={song.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-2">
            <Cover src={song.coverUrl} alt="" className="size-11" rounded="rounded-lg" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{song.title}</div>
              <div className="truncate text-sm text-muted">{song.artistName}</div>
            </div>
            <IconButton label="Chuyển lên" size="sm" disabled={i === 0} onClick={() => move(i, i - 1)}>
              <ArrowUp className="size-4" />
            </IconButton>
            <IconButton label="Chuyển xuống" size="sm" disabled={i === order.length - 1} onClick={() => move(i, i + 1)}>
              <ArrowDown className="size-4" />
            </IconButton>
          </li>
        ))}
      </ol>
    </div>
  );
}
