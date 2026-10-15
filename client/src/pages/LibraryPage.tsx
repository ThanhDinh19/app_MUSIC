import { ChevronRight, Clock, Disc3, Heart, ListMusic, Plus, ShieldCheck, User } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { useLibrary, useMe } from '../api/me';
import { AlbumCard, ArtistCard } from '../components/music/Cards';
import { PlaylistCover } from '../components/music/Cover';
import { Button, IconButton } from '../components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import { useUiStore } from '../features/ui/ui.store';
import { cn } from '../lib/cn';

const TABS = [
  { id: 'playlists', label: 'Playlist' },
  { id: 'albums', label: 'Album' },
  { id: 'artists', label: 'Nghệ sĩ' },
] as const;
type Tab = (typeof TABS)[number]['id'];

export default function LibraryPage() {
  const { data, isLoading, error, refetch } = useLibrary();
  const { data: me } = useMe();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.id === params.get('tab'))?.id ?? 'playlists') as Tab;
  const openPlaylistForm = useUiStore((s) => s.openPlaylistForm);
  const createPlaylist = () => openPlaylistForm({ mode: 'create' });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[1.9rem] font-extrabold tracking-tight sm:text-4xl">Thư viện</h1>
        <IconButton label="Tạo playlist" variant="glass" onClick={createPlaylist}>
          <Plus className="size-5" />
        </IconButton>
      </div>

      {me?.kind === 'guest' && (
        <Link
          to="/login?from=/library"
          className="glass mt-5 flex items-center gap-3 rounded-[1.25rem] p-3.5 pr-4 text-sm transition hover:bg-white/10 lg:max-w-3xl"
        >
          <ShieldCheck className="size-5 shrink-0 text-accent" />
          <span className="flex-1 text-muted">
            <b className="text-text">Đăng nhập</b> để giữ thư viện khi đổi điện thoại hoặc xoá dữ liệu trình duyệt.
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted" />
        </Link>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:max-w-3xl">
        <Link
          to="/library/favorites"
          className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#5b47d6] via-[#8a4fd1] to-[#f28cc0] p-4 transition hover:-translate-y-0.5 sm:p-5"
        >
          <Heart className="size-7 fill-current" />
          <div className="mt-6 text-lg font-bold sm:text-xl">Bài hát đã thích</div>
          <div className="text-sm text-white/80">{data ? `${data.favoritesCount} bài hát` : '—'}</div>
        </Link>
        <Link to="/library/history" className="glass relative overflow-hidden rounded-[1.5rem] p-4 transition hover:-translate-y-0.5 sm:p-5">
          <Clock className="size-7 text-accent" />
          <div className="mt-6 text-lg font-bold sm:text-xl">Nghe gần đây</div>
          <div className="text-sm text-muted">{data ? `${data.recentlyPlayed.length} bài gần nhất` : '—'}</div>
        </Link>
      </div>

      <div role="tablist" aria-label="Loại nội dung" className="mt-8 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            type="button"
            onClick={() => setParams({ tab: t.id }, { replace: true, preventScrollReset: true })}
            className={cn('h-10 rounded-full px-5 text-sm font-semibold transition', tab === t.id ? 'bg-white text-ink' : 'bg-white/10 hover:bg-white/16')}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[4.5rem]" />
            ))}
          </div>
        )}
        {error && <ErrorState error={error} onRetry={() => void refetch()} />}

        {data && tab === 'playlists' && (
          <div className="space-y-1">
            <button type="button" onClick={createPlaylist} className="flex w-full items-center gap-4 rounded-2xl p-2 text-left transition hover:bg-white/6">
              <span className="flex size-14 items-center justify-center rounded-xl border border-dashed border-white/25 bg-white/5">
                <Plus className="size-6" />
              </span>
              <span className="font-semibold">Tạo playlist mới</span>
            </button>
            {data.playlists.map((p) => (
              <Link key={p.id} to={`/playlist/${p.id}`} className="flex items-center gap-4 rounded-2xl p-2 transition hover:bg-white/6">
                <PlaylistCover coverUrl={p.coverUrl} previewCovers={p.previewCovers} name={p.name} className="size-14" rounded="rounded-xl" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{p.name}</span>
                  <span className="text-sm text-muted">Playlist · {p.songCount} bài hát</span>
                </span>
              </Link>
            ))}
            {data.playlists.length === 0 && (
              <EmptyState
                icon={<ListMusic className="size-7" />}
                title="Tạo playlist đầu tiên của bạn"
                description="Gom những bài hát bạn thích theo cách của riêng bạn."
                action={
                  <Button variant="primary" onClick={createPlaylist}>
                    Tạo playlist
                  </Button>
                }
              />
            )}
          </div>
        )}

        {data && tab === 'albums' &&
          (data.savedAlbums.length ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {data.savedAlbums.map((album) => (
                <AlbumCard key={album.id} album={album} subtitle="artist" fluid />
              ))}
            </div>
          ) : (
            <EmptyState icon={<Disc3 className="size-7" />} title="Chưa lưu album nào" description="Nhấn ♥ trên trang album để lưu vào Thư viện." action={<Link to="/discover"><Button>Khám phá album</Button></Link>} />
          ))}

        {data && tab === 'artists' &&
          (data.followedArtists.length ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {data.followedArtists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} fluid />
              ))}
            </div>
          ) : (
            <EmptyState icon={<User className="size-7" />} title="Chưa theo dõi nghệ sĩ nào" description="Theo dõi nghệ sĩ để nhanh chóng nghe nhạc mới của họ." action={<Link to="/discover"><Button>Tìm nghệ sĩ</Button></Link>} />
          ))}
      </div>
    </div>
  );
}
