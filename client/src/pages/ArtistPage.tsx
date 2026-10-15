import { MapPin } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router';
import { useArtist } from '../api/catalog';
import { AlbumCard, ArtistCard, PlaylistCard } from '../components/music/Cards';
import { FollowButton } from '../components/music/FollowButton';
import { PlayActions } from '../components/music/MediaHero';
import { SongList } from '../components/music/SongList';
import { Scroller, Section } from '../components/ui/Section';
import { ErrorState, Skeleton } from '../components/ui/States';
import { formatCompact, formatNumber } from '../lib/format';

export default function ArtistPage() {
  const { id = '' } = useParams();
  const { data, isLoading, error, refetch } = useArtist(id);
  const [showAll, setShowAll] = useState(false);

  if (isLoading) return <Skeleton className="h-[24rem] w-full rounded-panel" />;
  if (error || !data) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const { artist, topSongs, albums, relatedArtists, playlists } = data;
  const context = { type: 'artist' as const, id: artist.id, label: artist.name };

  return (
    <div className="animate-fade-in">
      <header className="relative -mx-4 -mt-2 overflow-hidden sm:mx-0 sm:mt-0 sm:rounded-panel">
        <img src={artist.imageUrl} alt={artist.name} className="h-[26rem] w-full object-cover object-[50%_30%] sm:h-[28rem]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10">
          <div className="flex items-center gap-2 text-sm font-semibold text-text/80">
            <MapPin className="size-4" />
            {artist.location}
          </div>
          <h1 className="mt-2 text-5xl font-extrabold tracking-[-0.03em] sm:text-6xl lg:text-7xl">{artist.name}</h1>
          <p className="mt-2 text-muted">
            {formatNumber(artist.monthlyListeners)} người nghe hằng tháng
            {artist.followers > 0 && ` · ${formatCompact(artist.followers)} người theo dõi trên Nocturne`}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5 sm:gap-3">
            <PlayActions songs={topSongs} context={context} />
            <FollowButton artistId={artist.id} className="h-12 px-6 sm:h-14" />
          </div>
        </div>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Section title="Phổ biến">
          <SongList songs={showAll ? topSongs : topSongs.slice(0, 5)} context={context} showAlbum />
          {topSongs.length > 5 && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-3 px-3 text-sm font-semibold text-muted hover:text-text">
              {showAll ? 'Thu gọn' : 'Xem thêm'}
            </button>
          )}
        </Section>
        <Section title="Giới thiệu">
          <div className="glass rounded-panel p-6">
            <p className="leading-relaxed text-text/90">{artist.bio}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {artist.genres.map((g) => (
                <span key={g.id} className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
                  {g.name}
                </span>
              ))}
            </div>
          </div>
        </Section>
      </div>

      {albums.length > 0 && (
        <Section title="Album & đĩa đơn">
          <Scroller>
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </Scroller>
        </Section>
      )}
      {playlists.length > 0 && (
        <Section title={`Có mặt trong`}>
          <Scroller>
            {playlists.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </Scroller>
        </Section>
      )}
      {relatedArtists.length > 0 && (
        <Section title="Nghệ sĩ tương tự">
          <Scroller>
            {relatedArtists.map((a) => (
              <ArtistCard key={a.id} artist={a} />
            ))}
          </Scroller>
        </Section>
      )}
    </div>
  );
}
