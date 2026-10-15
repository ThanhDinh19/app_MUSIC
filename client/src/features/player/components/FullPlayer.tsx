import { ChevronDown, Ellipsis, ListMusic, MicVocal } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { LikeButton } from '../../../components/music/LikeButton';
import { MoodChip } from '../../../components/music/MoodChip';
import { IconButton } from '../../../components/ui/Button';
import { Sheet } from '../../../components/ui/Sheet';
import { useOverlay } from '../../../hooks/useOverlay';
import { alpha, cn } from '../../../lib/cn';
import { LyricsView } from '../../lyrics/LyricsView';
import { useUiStore } from '../../ui/ui.store';
import { useCurrentItem, usePlayerStore } from '../player.store';
import { PlayerControls, VolumeControl } from './PlayerControls';
import { QueueList } from './QueueList';
import { SeekBar } from './SeekBar';

/**
 * Màn hình đang phát toàn màn hình. Mở bằng ?player=1 → nút Back của điện thoại sẽ đóng nó.
 * Điện thoại: nút "Lời bài hát" thay ảnh bìa bằng lời chạy theo nhạc.
 * Màn hình rộng: cột phải có 2 tab "Lời bài hát" / "Danh sách chờ".
 */
export function FullPlayer() {
  const player = useOverlay('player');
  const queueSheet = useOverlay('queue');
  const item = useCurrentItem();
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const context = usePlayerStore((s) => s.context);
  const openSongSheet = useUiStore((s) => s.openSongSheet);
  const lyricsOpen = useUiStore((s) => s.lyricsOpen);
  const setLyricsOpen = useUiStore((s) => s.setLyricsOpen);

  const open = player.isOpen && item !== null;

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      // Esc đóng trình phát, trừ khi đang mở một bảng (sheet) phía trên — bảng đó tự xử lý Esc.
      if (e.key === 'Escape' && !document.querySelector('[data-sheet]')) player.close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, player]);

  if (!open || !item) return null;
  const { song } = item;

  return createPortal(
    <div className="fixed inset-0 z-[60] animate-sheet-up overflow-hidden bg-ink" role="dialog" aria-modal="true" aria-label="Trình phát nhạc">
      {/* Nền: ảnh bìa phóng to làm mờ + màu tâm trạng */}
      <img src={song.coverUrl} alt="" aria-hidden className="absolute inset-0 size-full scale-125 object-cover opacity-55 blur-3xl" />
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(180deg, ${alpha(song.mood.color, 0.18)} 0%, rgb(12 16 36 / 0.72) 45%, rgb(12 16 36 / 0.95) 100%)` }}
      />

      <div className="relative mx-auto flex h-full max-w-6xl flex-col px-6 pt-[calc(var(--safe-top)+0.75rem)] pb-[calc(var(--safe-bottom)+1.25rem)] lg:px-10">
        <header className="flex items-center justify-between gap-3">
          <div className="flex w-[5.5rem]">
            <IconButton label="Thu nhỏ trình phát" onClick={player.close}>
              <ChevronDown className="size-7" />
            </IconButton>
          </div>
          <div className="min-w-0 text-center">
            <div className="text-[0.7rem] font-bold tracking-[0.2em] text-muted uppercase">Đang phát từ</div>
            <div className="truncate text-sm font-semibold">{context?.label ?? song.albumTitle}</div>
          </div>
          <div className="flex w-[5.5rem] justify-end">
            <IconButton label="Danh sách chờ" className="lg:hidden" onClick={queueSheet.open}>
              <ListMusic className="size-6" />
            </IconButton>
            <IconButton label="Tuỳ chọn" onClick={() => openSongSheet(song)}>
              <Ellipsis className="size-6" />
            </IconButton>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 gap-12 pt-4 lg:pt-8">
          {/* Cột trái: ảnh bìa (hoặc lời trên điện thoại) + thông tin + điều khiển */}
          <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col justify-evenly lg:mx-0 lg:max-w-[30rem]">
            <div className="relative flex min-h-0 flex-1 items-center justify-center py-4">
              <img
                src={song.coverUrl}
                alt={song.albumTitle}
                className={cn(
                  'aspect-square w-full max-w-[min(84vw,26rem,40dvh)] rounded-[1.75rem] object-cover transition duration-500 ease-out',
                  isPlaying ? 'scale-100' : 'scale-[0.92]',
                  lyricsOpen && 'max-lg:hidden',
                )}
                style={{ boxShadow: `0 40px 80px -30px ${alpha(song.mood.color, 0.55)}, 0 30px 60px -20px rgb(0 0 0 / 0.7)` }}
              />
              {lyricsOpen && <LyricsView key={song.id} song={song} className="absolute inset-0 lg:hidden" />}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <Link to={`/album/${song.albumId}`} className="block truncate text-2xl font-extrabold tracking-tight hover:underline">
                    {song.title}
                  </Link>
                  <Link to={`/artist/${song.artistId}`} className="mt-0.5 block truncate text-lg text-muted hover:text-text">
                    {song.artistName}
                  </Link>
                </div>
                <LikeButton songId={song.id} size="md" />
              </div>
              <MoodChip mood={song.mood} size="sm" link className="mt-3" />
              <SeekBar className="mt-5" />
              <PlayerControls className="mt-3" />
              <div className="mt-4 flex justify-center lg:hidden">
                <button
                  type="button"
                  aria-pressed={lyricsOpen}
                  onClick={() => setLyricsOpen(!lyricsOpen)}
                  className={cn(
                    'inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition active:scale-95',
                    lyricsOpen ? 'bg-white text-ink' : 'bg-white/10 text-text hover:bg-white/16',
                  )}
                >
                  <MicVocal className="size-4" />
                  Lời bài hát
                </button>
              </div>
              <VolumeControl className="mt-5 hidden lg:flex" />
            </div>
          </div>

          {/* Cột phải (màn hình rộng): lời bài hát / danh sách chờ */}
          <aside className="glass hidden min-h-0 w-[28rem] flex-col rounded-panel p-4 lg:flex xl:w-[32rem]">
            <div role="tablist" aria-label="Nội dung cột phải" className="mb-3 grid grid-cols-2 gap-1 rounded-full bg-white/8 p-1">
              {[
                { id: true, label: 'Lời bài hát' },
                { id: false, label: 'Danh sách chờ' },
              ].map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  role="tab"
                  aria-selected={lyricsOpen === tab.id}
                  onClick={() => setLyricsOpen(tab.id)}
                  className={cn(
                    'h-10 rounded-full text-sm font-semibold transition',
                    lyricsOpen === tab.id ? 'bg-white text-ink' : 'text-muted hover:text-text',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {lyricsOpen ? (
              <LyricsView key={song.id} song={song} className="min-h-0 flex-1 px-3" />
            ) : (
              <QueueList className="no-scrollbar min-h-0 flex-1 overflow-y-auto" />
            )}
          </aside>
        </div>
      </div>

      <Sheet open={queueSheet.isOpen} onClose={queueSheet.close} title="Danh sách chờ">
        <QueueList className="px-3 pb-2" />
      </Sheet>
    </div>,
    document.body,
  );
}
