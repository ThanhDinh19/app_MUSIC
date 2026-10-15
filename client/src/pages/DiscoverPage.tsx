import { useDiscover, useEditorialPlaylists } from '../api/catalog';
import { ArtistCard, GenreTile, MoodTile, PlaylistCard } from '../components/music/Cards';
import { SongList } from '../components/music/SongList';
import { Scroller, Section } from '../components/ui/Section';
import { ErrorState, Skeleton } from '../components/ui/States';

export default function DiscoverPage() {
  const { data, isLoading, error, refetch } = useDiscover();
  const { data: playlists } = useEditorialPlaylists();

  return (
    <div className="animate-fade-in">
      <h1 className="text-[1.9rem] font-extrabold tracking-tight sm:text-4xl">Khám phá</h1>
      <p className="mt-1 text-muted">Chọn một tâm trạng, một thể loại — phần còn lại để âm nhạc lo.</p>

      {isLoading && (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-[1.5rem]" />
          ))}
        </div>
      )}
      {error && <ErrorState error={error} onRetry={() => void refetch()} />}

      {data && (
        <>
          <Section title="Theo tâm trạng" className="mt-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {data.moods.map((mood) => (
                <MoodTile key={mood.id} mood={mood} />
              ))}
            </div>
          </Section>

          {playlists && playlists.length > 0 && (
            <Section title="Playlist biên tập">
              <Scroller>
                {playlists.map((p) => (
                  <PlaylistCard key={p.id} playlist={p} />
                ))}
              </Scroller>
            </Section>
          )}

          <Section title="Thể loại">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              {data.genres.map((genre) => (
                <GenreTile key={genre.id} genre={genre} />
              ))}
            </div>
          </Section>

          <Section title="Nghệ sĩ">
            <Scroller>
              {data.artists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </Scroller>
          </Section>

          <Section title="Mới cập nhật">
            <SongList songs={data.freshSongs} context={{ type: 'home', id: 'fresh', label: 'Mới cập nhật' }} showAlbum />
          </Section>
        </>
      )}
    </div>
  );
}
