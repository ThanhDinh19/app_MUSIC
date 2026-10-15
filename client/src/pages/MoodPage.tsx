import { useParams } from 'react-router';
import { useMood } from '../api/catalog';
import { AlbumCard } from '../components/music/Cards';
import { ColorCover } from '../components/music/ColorCover';
import { MediaHero, PlayActions } from '../components/music/MediaHero';
import { SongList } from '../components/music/SongList';
import { Scroller, Section } from '../components/ui/Section';
import { ErrorState, PageSkeleton } from '../components/ui/States';

export default function MoodPage() {
  const { id = '' } = useParams();
  const { data, isLoading, error, refetch } = useMood(id);
  if (isLoading) return <PageSkeleton />;
  if (error || !data) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const { mood, songs, albums } = data;
  const context = { type: 'mood' as const, id: mood.id, label: `Tâm trạng: ${mood.name}` };

  return (
    <div className="animate-fade-in">
      <section className="glass rounded-panel px-4 py-7 sm:p-8 lg:p-10" style={{ boxShadow: `0 40px 120px -60px ${mood.color}` }}>
        <MediaHero
          cover={<ColorCover color={mood.color} imageUrl={mood.coverUrl} label={mood.name} />}
          eyebrow="Tâm trạng"
          title={mood.name}
          description={mood.description}
          meta={<span>{mood.songCount} bài hát</span>}
          actions={<PlayActions songs={songs} context={context} />}
        />
        <SongList songs={songs} context={context} showAlbum showMood={false} className="mt-9" />
      </section>

      {albums.length > 0 && (
        <Section title="Album mang tâm trạng này" className="mt-10">
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
