import { Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';
import { AddToPlaylistSheet, PlaylistFormSheet } from '../music/PlaylistSheets';
import { SongActionsSheet } from '../music/SongActionsSheet';
import { LyricsSheet } from '../../features/lyrics/LyricsSheet';
import { FullPlayer } from '../../features/player/components/FullPlayer';
import { MiniPlayer } from '../../features/player/components/MiniPlayer';
import { PlayerBar } from '../../features/player/components/PlayerBar';
import { usePlayerStore } from '../../features/player/player.store';
import { cn } from '../../lib/cn';
import { PageSkeleton } from '../ui/States';
import { Toaster } from '../ui/Toaster';
import { AmbientBackground } from './AmbientBackground';
import { OfflineBanner, UpdatePrompt } from './AppNotices';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';

/** Khung chung của mọi trang: nền, thanh trên, nội dung, trình phát, điều hướng và các bảng dùng chung. */
export function AppShell() {
  const hasTrack = usePlayerStore((s) => s.queue.length > 0);

  return (
    <div className="relative isolate min-h-dvh overflow-x-clip">
      <AmbientBackground />
      <TopBar />
      <main
        className={cn(
          'mx-auto w-full max-w-[1440px] px-4 pt-2 sm:px-6 lg:px-10 lg:pt-0',
          hasTrack
            ? 'pb-[calc(var(--nav-h)+var(--mini-h)+var(--safe-bottom)+2rem)] lg:pb-[calc(var(--bar-h)+2.5rem)]'
            : 'pb-[calc(var(--nav-h)+var(--safe-bottom)+2rem)] lg:pb-12',
        )}
      >
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>

      <MiniPlayer />
      <PlayerBar />
      <BottomNav />
      <FullPlayer />

      <SongActionsSheet />
      <AddToPlaylistSheet />
      <PlaylistFormSheet />
      <LyricsSheet />
      <Toaster />
      <OfflineBanner />
      <UpdatePrompt />
      <ScrollRestoration getKey={(location) => location.pathname} />
    </div>
  );
}
