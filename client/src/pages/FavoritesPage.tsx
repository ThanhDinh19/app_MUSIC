import type { MoodShare, Song } from '@nocturne/shared';
import { Heart } from 'lucide-react';
import { Link } from 'react-router';
import { useFavorites, useMe } from '../api/me';
import { MediaHero, MetaDot, PlayActions } from '../components/music/MediaHero';
import { MoodBreakdownCard } from '../components/music/MoodBreakdownCard';
import { SongList } from '../components/music/SongList';
import { Button } from '../components/ui/Button';
import { EmptyState, ErrorState, PageSkeleton } from '../components/ui/States';
import { formatDuration } from '../lib/format';

export default function FavoritesPage() {
  const { data: songs, isLoading, error, refetch } = useFavorites();
  const { data: me } = useMe();

  if (isLoading) return <PageSkeleton />;
  if (error || !songs) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const context = { type: 'favorites' as const, id: 'favorites', label: 'Bài hát đã thích' };
  const total = songs.reduce((sum, s) => sum + s.durationSec, 0);

  return (
    <div className="grid animate-fade-in items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] xl:gap-8">
      <section className="glass rounded-panel px-4 py-7 sm:p-8 lg:p-10">
        <MediaHero
          cover={
            <div className="flex aspect-square w-full items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-[#5b47d6] via-[#8a4fd1] to-[#f28cc0] shadow-[0_30px_60px_-25px_rgb(0_0_0/0.85)]">
              <Heart className="size-1/3 fill-white text-white" />
            </div>
          }
          eyebrow="Playlist"
          title="Bài hát đã thích"
          meta={
            <>
              <span className="font-bold text-text">{me?.displayName}</span>
              <MetaDot />
              <span>{songs.length} bài hát</span>
              {total > 0 && (
                <>
                  <MetaDot />
                  <span>{formatDuration(total)}</span>
                </>
              )}
            </>
          }
          actions={<PlayActions songs={songs} context={context} />}
        />
        <div className="mt-9">
          {songs.length === 0 ? (
            <EmptyState
              icon={<Heart className="size-7" />}
              title="Chưa có bài hát nào"
              description="Nhấn ♥ ở bất kỳ bài hát nào để lưu vào đây."
              action={
                <Link to="/discover">
                  <Button variant="primary">Khám phá nhạc</Button>
                </Link>
              }
            />
          ) : (
            <SongList songs={songs} context={context} header numbered showAlbum />
          )}
        </div>
      </section>
      <aside>
        <MoodBreakdownCard title="Gu nghe nhạc của bạn" shares={breakdown(songs)} />
      </aside>
    </div>
  );
}

function breakdown(songs: Song[]): MoodShare[] {
  const total = songs.reduce((sum, s) => sum + s.durationSec, 0);
  const map = new Map<string, MoodShare>();
  for (const s of songs) {
    const share = map.get(s.mood.id) ?? { moodId: s.mood.id, name: s.mood.name, color: s.mood.color, durationSec: 0, percent: 0 };
    share.durationSec += s.durationSec;
    map.set(s.mood.id, share);
  }
  return [...map.values()]
    .map((s) => ({ ...s, percent: total ? Math.round((s.durationSec / total) * 100) : 0 }))
    .sort((a, b) => b.durationSec - a.durationSec);
}
