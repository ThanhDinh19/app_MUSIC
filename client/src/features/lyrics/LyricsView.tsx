import type { Lyrics, Song } from '@nocturne/shared';
import { MicVocal, Music } from 'lucide-react';
import { type ReactNode, useEffect, useRef } from 'react';
import { useLyrics } from '../../api/catalog';
import { Skeleton } from '../../components/ui/States';
import { ApiError } from '../../lib/api';
import { cn } from '../../lib/cn';
import { usePlayerStore } from '../player/player.store';
import { useProgressStore } from '../player/progress.store';
import { activeLineIndex } from './lyrics.utils';

/** Sáng dòng sớm một chút cho cảm giác "theo kịp" nhạc. */
const LOOKAHEAD_SEC = 0.25;
/** Người dùng tự cuộn → tạm dừng tự cuộn trong khoảng này. */
const USER_SCROLL_PAUSE_MS = 3500;

interface LyricsViewProps {
  song: Song;
  /** `player`: chữ lớn, căn giữa dòng đang hát. `sheet`: chữ vừa, dùng trong bảng xem lời. */
  variant?: 'player' | 'sheet';
  className?: string;
}

/**
 * Lời bài hát. Nếu là bài đang phát và lời có mốc thời gian:
 * dòng đang hát sáng lên, tự cuộn theo nhạc, chạm vào dòng nào thì tua tới dòng đó.
 */
export function LyricsView({ song, variant = 'player', className }: LyricsViewProps) {
  const { data, isLoading, error } = useLyrics(song.id);

  if (isLoading) {
    return (
      <div className={cn('space-y-4 py-10', className)}>
        {[70, 90, 55, 80, 65].map((w, i) => (
          <Skeleton key={i} className="h-7" style={{ width: `${w}%` }} />
        ))}
      </div>
    );
  }
  if (error) {
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <LyricsMessage
        className={className}
        icon={<MicVocal className="size-7" />}
        title={missing ? 'Chưa có lời cho bài hát này' : 'Không tải được lời bài hát'}
        description={missing ? 'Lời sẽ xuất hiện ở đây khi được cập nhật.' : 'Kiểm tra kết nối mạng rồi thử lại.'}
      />
    );
  }
  if (!data) return null;
  if (data.instrumental || !data.lines.some((l) => l.text)) {
    return <LyricsMessage className={className} icon={<Music className="size-7" />} title="Bản nhạc không lời" description="Cứ thả mình theo giai điệu nhé." />;
  }
  return <LyricsLines lyrics={data} song={song} variant={variant} className={className} />;
}

function LyricsLines({ lyrics, song, variant, className }: { lyrics: Lyrics; song: Song; variant: 'player' | 'sheet'; className?: string }) {
  const isCurrent = usePlayerStore((s) => s.queue[s.index]?.song.id === song.id);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const seek = usePlayerStore((s) => s.seek);
  const { lines } = lyrics;
  const live = lyrics.synced && isCurrent;
  // Chỉ re-render khi đổi dòng (không phải mỗi lần thời gian cập nhật).
  const active = useProgressStore((s) => (live ? activeLineIndex(lines, s.currentTime + LOOKAHEAD_SEC) : -1));

  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLElement | null)[]>([]);
  const pauseAutoScrollUntil = useRef(0);

  useEffect(() => {
    if (active < 0 || Date.now() < pauseAutoScrollUntil.current) return;
    const container = containerRef.current;
    const el = lineRefs.current[active];
    if (!container || !el) return;
    const anchor = variant === 'player' ? 0.38 : 0.3;
    container.scrollTo({ top: el.offsetTop - container.clientHeight * anchor + el.offsetHeight / 2, behavior: 'smooth' });
  }, [active, variant]);

  const pauseAutoScroll = () => {
    pauseAutoScrollUntil.current = Date.now() + USER_SCROLL_PAUSE_MS;
  };

  const big = variant === 'player';

  return (
    <div
      ref={containerRef}
      onWheel={pauseAutoScroll}
      onTouchMove={pauseAutoScroll}
      className={cn(
        'no-scrollbar relative overflow-y-auto overscroll-contain',
        big && '[mask-image:linear-gradient(to_bottom,transparent,#000_12%,#000_86%,transparent)]',
        className,
      )}
    >
      <div className={big ? 'py-[38%]' : 'py-1'}>
        {lines.map((line, i) => {
          if (!line.text) {
            return (
              <div key={i} ref={(el) => void (lineRefs.current[i] = el)} aria-hidden className={cn('flex gap-1.5', big ? 'py-4' : 'py-2')}>
                {big &&
                  [0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className={cn('size-2 rounded-full bg-white transition-opacity duration-500', i === active && isPlaying ? 'animate-pulse opacity-90' : 'opacity-25')}
                      style={{ animationDelay: `${d * 0.2}s` }}
                    />
                  ))}
              </div>
            );
          }
          const state = !live ? 'static' : i === active ? 'active' : i < active ? 'past' : 'future';
          return (
            <button
              key={i}
              type="button"
              ref={(el) => void (lineRefs.current[i] = el)}
              disabled={!live}
              aria-current={state === 'active' ? 'true' : undefined}
              onClick={() => {
                pauseAutoScrollUntil.current = 0;
                seek(line.time);
              }}
              className={cn(
                'block w-full text-left font-extrabold tracking-tight text-balance transition-[opacity,filter,transform] duration-500 ease-out disabled:cursor-default',
                big ? 'origin-left py-2.5 text-[1.6rem] leading-[1.18] sm:text-[1.9rem]' : 'py-1.5 text-lg leading-snug',
                state === 'active' && 'scale-[1.02] opacity-100',
                state === 'past' && 'opacity-30 hover:opacity-60',
                state === 'future' && 'opacity-45 hover:opacity-75',
                state === 'static' && 'opacity-90',
                live && state !== 'active' && big && 'blur-[0.4px]',
              )}
            >
              {line.text}
            </button>
          );
        })}
        {lyrics.writers.length > 0 && (
          <p className={cn('text-sm font-medium text-muted', big ? 'mt-8' : 'mt-5')}>Sáng tác: {lyrics.writers.join(', ')}</p>
        )}
      </div>
    </div>
  );
}

function LyricsMessage({ icon, title, description, className }: { icon: ReactNode; title: string; description: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 text-center', className)}>
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-white/10 text-muted">{icon}</div>
      <p className="text-lg font-bold">{title}</p>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}
