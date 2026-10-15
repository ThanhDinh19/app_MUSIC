import type { LyricsMatch, SearchResults, SearchTopResult } from '@nocturne/shared';
import { MicVocal, Play, Search, SearchX, X } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useDiscover, useSearch } from '../api/catalog';
import { AlbumCard, ArtistCard, GenreTile, MoodTile, PlaylistCard } from '../components/music/Cards';
import { Cover, PlaylistCover } from '../components/music/Cover';
import { SongList } from '../components/music/SongList';
import { IconButton } from '../components/ui/Button';
import { Scroller, Section } from '../components/ui/Section';
import { EmptyState, Skeleton } from '../components/ui/States';
import { usePlayerStore } from '../features/player/player.store';
import { useUiStore } from '../features/ui/ui.store';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { cn } from '../lib/cn';
import { storage } from '../lib/storage';
import { findFolded } from '../lib/text';

const RECENT_KEY = 'nocturne:recent-searches';
const TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'songs', label: 'Bài hát' },
  { id: 'albums', label: 'Album' },
  { id: 'artists', label: 'Nghệ sĩ' },
  { id: 'playlists', label: 'Playlist' },
] as const;
type Tab = (typeof TABS)[number]['id'];

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const urlQuery = params.get('q') ?? '';
  const [input, setInput] = useState(urlQuery);
  const [tab, setTab] = useState<Tab>('all');
  const [recent, setRecent] = useState<string[]>(() => storage.get(RECENT_KEY, []));
  const inputRef = useRef<HTMLInputElement>(null);
  const query = useDebouncedValue(input.trim(), 280);
  const { data, isFetching } = useSearch(query);

  // Giữ từ khoá trên URL để quay lại (Back) vẫn thấy kết quả cũ.
  useEffect(() => {
    if (query === urlQuery) return;
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (query) next.set('q', query);
        else next.delete('q');
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  }, [query, urlQuery, setParams]);

  const remember = () => {
    if (!query) return;
    const next = [query, ...recent.filter((r) => r.toLowerCase() !== query.toLowerCase())].slice(0, 8);
    setRecent(next);
    storage.set(RECENT_KEY, next);
  };

  const removeRecent = (term: string) => {
    const next = recent.filter((r) => r !== term);
    setRecent(next);
    storage.set(RECENT_KEY, next);
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-[1.9rem] font-extrabold tracking-tight sm:text-4xl">Tìm kiếm</h1>

      <form
        role="search"
        className="mt-5"
        onSubmit={(e) => {
          e.preventDefault();
          remember();
          inputRef.current?.blur();
        }}
      >
        <label className="glass flex h-14 items-center gap-3 rounded-full pr-2 pl-5 focus-within:border-accent/50">
          <Search className="size-5 shrink-0 text-muted" />
          <input
            ref={inputRef}
            type="search"
            value={input}
            autoFocus={!urlQuery}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Bài hát, nghệ sĩ, album, playlist..."
            aria-label="Từ khoá tìm kiếm"
            enterKeyHint="search"
            className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-faint [&::-webkit-search-cancel-button]:hidden"
          />
          {input && (
            <IconButton
              label="Xoá từ khoá"
              size="sm"
              onClick={() => {
                setInput('');
                inputRef.current?.focus();
              }}
            >
              <X className="size-5" />
            </IconButton>
          )}
        </label>
      </form>

      {!query ? (
        <Browse recent={recent} onPick={(term) => setInput(term)} onRemove={removeRecent} />
      ) : (
        <div className="mt-5" onClickCapture={remember}>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition',
                  tab === t.id ? 'bg-white text-ink' : 'bg-white/10 text-text hover:bg-white/16',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          {!data ? (
            <div className="mt-6 space-y-3">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : (
            <div className={cn('transition-opacity', isFetching && 'opacity-60')}>
              <Results data={data} tab={tab} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Browse({ recent, onPick, onRemove }: { recent: string[]; onPick: (term: string) => void; onRemove: (term: string) => void }) {
  const { data } = useDiscover();
  return (
    <>
      {recent.length > 0 && (
        <Section title="Tìm kiếm gần đây" className="mt-8">
          <div className="flex flex-wrap gap-2">
            {recent.map((term) => (
              <span key={term} className="inline-flex h-10 items-center gap-1 rounded-full bg-white/10 pr-1 pl-4 text-sm font-semibold">
                <button type="button" onClick={() => onPick(term)}>
                  {term}
                </button>
                <IconButton label={`Xoá “${term}”`} size="sm" className="size-8 text-muted" onClick={() => onRemove(term)}>
                  <X className="size-4" />
                </IconButton>
              </span>
            ))}
          </div>
        </Section>
      )}
      {data && (
        <>
          <Section title="Duyệt theo tâm trạng" className="mt-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {data.moods.map((mood) => (
                <MoodTile key={mood.id} mood={mood} />
              ))}
            </div>
          </Section>
          <Section title="Duyệt theo thể loại">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {data.genres.map((genre) => (
                <GenreTile key={genre.id} genre={genre} />
              ))}
            </div>
          </Section>
        </>
      )}
    </>
  );
}

function Results({ data, tab }: { data: SearchResults; tab: Tab }) {
  const context = { type: 'search' as const, id: data.query, label: `Tìm kiếm “${data.query}”` };
  const empty = !data.songs.length && !data.albums.length && !data.artists.length && !data.playlists.length && !data.lyricsMatches.length;
  if (empty) {
    return <EmptyState icon={<SearchX className="size-7" />} title={`Không tìm thấy “${data.query}”`} description="Thử từ khoá khác, kiểm tra chính tả hoặc tìm theo tên nghệ sĩ." />;
  }

  if (tab === 'songs') return <SongList songs={data.songs} context={context} showAlbum className="mt-6" />;
  const grid = 'mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6';
  if (tab === 'albums') return <div className={grid}>{data.albums.map((a) => <AlbumCard key={a.id} album={a} subtitle="artist" fluid />)}</div>;
  if (tab === 'artists') return <div className={grid}>{data.artists.map((a) => <ArtistCard key={a.id} artist={a} fluid />)}</div>;
  if (tab === 'playlists') return <div className={grid}>{data.playlists.map((p) => <PlaylistCard key={p.id} playlist={p} fluid />)}</div>;

  return (
    <>
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        {data.topResult && (
          <Section title="Kết quả hàng đầu" className="mt-0">
            <TopResult result={data.topResult} songs={data.songs} />
          </Section>
        )}
        {data.songs.length > 0 && (
          <Section title="Bài hát" className="mt-0">
            <SongList songs={data.songs.slice(0, 4)} context={context} showMood={false} />
          </Section>
        )}
      </div>
      {data.lyricsMatches.length > 0 && <LyricsMatches matches={data.lyricsMatches} query={data.query} />}
      {data.artists.length > 0 && (
        <Section title="Nghệ sĩ">
          <Scroller>
            {data.artists.map((a) => (
              <ArtistCard key={a.id} artist={a} />
            ))}
          </Scroller>
        </Section>
      )}
      {data.albums.length > 0 && (
        <Section title="Album">
          <Scroller>
            {data.albums.map((a) => (
              <AlbumCard key={a.id} album={a} subtitle="artist" />
            ))}
          </Scroller>
        </Section>
      )}
      {data.playlists.length > 0 && (
        <Section title="Playlist">
          <Scroller>
            {data.playlists.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </Scroller>
        </Section>
      )}
    </>
  );
}
/** Bài hát có lời chứa từ khoá: bấm để xem lời, nút ▶ để phát. */
function LyricsMatches({ matches, query }: { matches: LyricsMatch[]; query: string }) {
  const openLyricsSheet = useUiStore((s) => s.openLyricsSheet);
  const playSongs = usePlayerStore((s) => s.playSongs);
  const songs = matches.map((m) => m.song);

  return (
    <Section title="Khớp lời bài hát" subtitle="Bấm để xem toàn bộ lời">
      <div className="grid gap-1 lg:grid-cols-2 lg:gap-x-6">
        {matches.map(({ song, line }, i) => (
          <div key={song.id} className="flex items-center gap-2 rounded-2xl pr-2 transition hover:bg-white/6">
            <button type="button" onClick={() => openLyricsSheet(song)} className="flex min-w-0 flex-1 items-center gap-4 p-2 text-left">
              <Cover src={song.coverUrl} alt={song.albumTitle} className="size-14" rounded="rounded-xl" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{song.title}</span>
                <span className="block truncate text-sm text-muted">{song.artistName}</span>
                <span className="mt-1 flex items-center gap-1.5 text-sm text-text/85">
                  <MicVocal className="size-3.5 shrink-0 text-accent" />
                  <span className="truncate italic">
                    “<Highlight text={line} query={query} />”
                  </span>
                </span>
              </span>
            </button>
            <IconButton label={`Phát ${song.title}`} variant="glass" size="sm" onClick={() => playSongs(songs, i, { type: 'search', label: `Lời có “${query}”` })}>
              <Play className="ml-0.5 size-4 fill-current" />
            </IconButton>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const range = findFolded(text, query);
  if (!range) return <>{text}</>;
  const [start, end] = range;
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded bg-accent/25 px-0.5 font-semibold text-text not-italic">{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  );
}

function TopResult({ result, songs }: { result: SearchTopResult; songs: SearchResults['songs'] }) {
  const playSongs = usePlayerStore((s) => s.playSongs);

  switch (result.type) {
    case 'song': {
      const song = result.item;
      const index = Math.max(0, songs.findIndex((s) => s.id === song.id));
      return (
        <TopCard
          media={<Cover src={song.coverUrl} alt={song.albumTitle} className="size-20 shadow-xl sm:size-24" />}
          title={song.title}
          badge="Bài hát"
          subtitle={song.artistName}
          onClick={() => playSongs(songs, index, { type: 'search', label: 'Tìm kiếm' })}
        />
      );
    }
    case 'artist': {
      const a = result.item;
      return <TopCard to={`/artist/${a.id}`} media={<img src={a.imageUrl} alt={a.name} className="size-20 rounded-full object-cover shadow-xl sm:size-24" />} title={a.name} badge="Nghệ sĩ" />;
    }
    case 'album': {
      const a = result.item;
      return <TopCard to={`/album/${a.id}`} media={<Cover src={a.coverUrl} alt={a.title} className="size-20 shadow-xl sm:size-24" />} title={a.title} badge="Album" subtitle={a.artistName} />;
    }
    case 'playlist': {
      const p = result.item;
      return (
        <TopCard
          to={`/playlist/${p.id}`}
          media={<PlaylistCover coverUrl={p.coverUrl} previewCovers={p.previewCovers} name={p.name} className="size-20 shadow-xl sm:size-24" />}
          title={p.name}
          badge="Playlist"
          subtitle={p.ownerName}
        />
      );
    }
  }
}

interface TopCardProps {
  media: ReactNode;
  title: string;
  badge: string;
  subtitle?: string;
  to?: string;
  onClick?: () => void;
}

/** Thẻ kết quả hàng đầu — điện thoại: ảnh trái, chữ phải; màn hình rộng: ảnh trên, chữ dưới. */
function TopCard({ media, title, badge, subtitle, to, onClick }: TopCardProps) {
  const className = 'glass group relative flex w-full items-center gap-4 rounded-panel p-4 text-left transition hover:bg-white/10 sm:flex-col sm:items-start sm:gap-5 sm:p-5';
  const body = (
    <>
      {media}
      <div className="min-w-0 flex-1 pr-12 sm:pr-0">
        <div className="truncate text-xl font-extrabold sm:text-2xl">{title}</div>
        <div className="mt-1.5 flex items-center gap-2 text-sm text-muted">
          <span className="rounded-full bg-white/12 px-2.5 py-0.5 font-semibold text-text">{badge}</span>
          {subtitle && <span className="truncate">{subtitle}</span>}
        </div>
      </div>
      {onClick && (
        <span className="absolute right-4 flex size-11 items-center justify-center rounded-full bg-white text-ink shadow-xl transition group-hover:scale-105 sm:right-5 sm:bottom-5 sm:size-12">
          <Play className="ml-0.5 size-5 fill-current" />
        </span>
      )}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={className}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" className={className} onClick={onClick}>
      {body}
    </button>
  );
}
