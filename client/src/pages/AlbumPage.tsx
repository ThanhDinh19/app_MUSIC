import { useParams } from 'react-router';
import { useAlbum } from '../api/catalog';
import { AlbumPanel } from '../components/music/AlbumPanel';
import { AlbumCard } from '../components/music/Cards';
import { Scroller, Section } from '../components/ui/Section';
import { ErrorState, PageSkeleton } from '../components/ui/States';

export default function AlbumPage() {
  const { id = '' } = useParams();
  const { data, isLoading, error, refetch } = useAlbum(id);

  if (isLoading) return <PageSkeleton />;
  if (error || !data) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="animate-fade-in">
      <AlbumPanel detail={data} />
      {data.moreFromArtist.length > 0 && (
        <Section title={`Thêm từ ${data.artist.name}`} moreTo={`/artist/${data.artist.id}`} moreLabel="Trang nghệ sĩ" className="mt-10">
          <Scroller>
            {data.moreFromArtist.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </Scroller>
        </Section>
      )}
    </div>
  );
}
