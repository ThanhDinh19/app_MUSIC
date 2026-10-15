import type { Song } from '@nocturne/shared';
import { useHome } from '../api/catalog';
import { useMe } from '../api/me';
import { AlbumPanel } from '../components/music/AlbumPanel';
import { AlbumCard, ArtistCard, PlaylistCard } from '../components/music/Cards';
import { Cover } from '../components/music/Cover';
import { InstallBanner } from '../components/music/InstallBanner';
import { MoodChip } from '../components/music/MoodChip';
import { SongList } from '../components/music/SongList';
import { Scroller, Section } from '../components/ui/Section';
import { ErrorState, Skeleton } from '../components/ui/States';
import { usePlayerStore } from '../features/player/player.store';
import { greeting } from '../lib/format';

export default function HomePage() {
  const { data, isLoading, error, refetch } = useHome();
  const { data: me } = useMe();

  if (isLoading) return <HomeSkeleton />;
  if (error || !data) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const name = me && me.displayName !== 'Khách' ? `, ${me.displayName}` : '';

  return (
    <div className="animate-fade-in">
      <div className="mb-6 lg:mb-8">
        <p className="font-semibold text-muted">
          {greeting()}
          {name}
        </p>
        <h1 className="mt-1 text-[1.9rem] leading-tight font-extrabold tracking-tight sm:text-4xl">Hôm nay bạn muốn nghe gì?</h1>
      </div>

      <InstallBanner />

      <Scroller className="mb-8 gap-2.5">
        {data.moods.map((mood) => (
          <MoodChip key={mood.id} mood={mood} link className="snap-start" />
        ))}
      </Scroller>

      {data.featured && <AlbumPanel detail={data.featured} eyebrow="Album nổi bật" songLimit={5} />}

      {data.recentlyPlayed.length > 0 && (
        <Section title="Nghe gần đây" moreTo="/library/history" className="mt-10">
          <RecentlyPlayed songs={data.recentlyPlayed} />
        </Section>
      )}

      <Section title="Thịnh hành" subtitle="Những bài được nghe nhiều nhất trên Nocturne" className="mt-10">
        <SongList songs={data.trending.slice(0, 8)} context={{ type: 'home', id: 'trending', label: 'Thịnh hành' }} showAlbum showMood={false} listClassName="xl:grid xl:grid-cols-2 xl:gap-x-6 xl:space-y-0" />
      </Section>

      <Section title="Mới phát hành">
        <Scroller>
          {data.newReleases.map((album) => (
            <AlbumCard key={album.id} album={album} subtitle="artist" />
          ))}
        </Scroller>
      </Section>

      <Section title="Playlist dành cho bạn" moreTo="/discover">
        <Scroller>
          {data.editorialPlaylists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </Scroller>
      </Section>

      <Section title="Nghệ sĩ nổi bật">
        <Scroller>
          {data.artists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </Scroller>
      </Section>
    </div>
  );
}

function RecentlyPlayed({ songs }: { songs: Song[] }) {
  const playSongs = usePlayerStore((s) => s.playSongs);
  return (
    <Scroller>
      {songs.map((song, i) => (
        <button
          key={song.id}
          type="button"
          onClick={() => playSongs(songs, i, { type: 'history', label: 'Nghe gần đây' })}
          className="group w-32 shrink-0 snap-start text-left sm:w-36"
        >
          <Cover src={song.coverUrl} alt={song.albumTitle} className="w-full transition duration-300 group-hover:brightness-110" />
          <div className="mt-2 truncate text-sm font-semibold">{song.title}</div>
          <div className="truncate text-xs text-muted">{song.artistName}</div>
        </button>
      ))}
    </Scroller>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-72 max-w-full" />
      </div>
      <div className="flex gap-2.5 overflow-hidden">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-[28rem] w-full rounded-panel" />
    </div>
  );
}
