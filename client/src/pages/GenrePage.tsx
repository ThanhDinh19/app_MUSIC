import { useParams } from 'react-router';
import { useGenre } from '../api/catalog';
import { AlbumCard, ArtistCard } from '../components/music/Cards';
import { ColorCover } from '../components/music/ColorCover';
import { MediaHero, PlayActions } from '../components/music/MediaHero';
import { SongList } from '../components/music/SongList';
import { Scroller, Section } from '../components/ui/Section';
import { ErrorState, PageSkeleton } from '../components/ui/States';

export default function GenrePage() {
  const { id = '' } = useParams();
  const { data, isLoading, error, refetch } = useGenre(id);
  if (isLoading) return <PageSkeleton />;
  if (error || !data) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const { genre, songs, albums, artists } = data;
  const context = { type: 'genre' as const, id: genre.id, label: genre.name };

  return (
    <div className="animate-fade-in">
      <section className="glass rounded-panel px-4 py-7 sm:p-8 lg:p-10">
        <MediaHero
          cover={<ColorCover color={genre.color} imageUrl={genre.coverUrl} label={genre.name} />}
          eyebrow="Thể loại"
          title={genre.name}
          description={genre.description}
          meta={<span>{genre.songCount} bài hát</span>}
          actions={<PlayActions songs={songs} context={context} />}
        />
        <SongList songs={songs} context={context} showAlbum className="mt-9" />
      </section>

      {artists.length > 0 && (
        <Section title="Nghệ sĩ" className="mt-10">
          <Scroller>
            {artists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </Scroller>
        </Section>
      )}
      {albums.length > 0 && (
        <Section title="Album">
          <Scroller>
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} subtitle="artist" />
            ))}
          </Scroller>
        </Section>
      )}
    </div>
  );
}
