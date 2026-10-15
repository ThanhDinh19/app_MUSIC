import type { Song } from '@nocturne/shared';
import { Pause, Play, Shuffle } from 'lucide-react';
import type { ReactNode } from 'react';
import { type PlayContext, usePlayerStore } from '../../features/player/player.store';
import { cn } from '../../lib/cn';
import { Button, IconButton } from '../ui/Button';

interface MediaHeroProps {
  cover: ReactNode;
  eyebrow: string;
  chip?: ReactNode;
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/** Phần đầu trang album / playlist / tâm trạng: ảnh bìa, tiêu đề lớn, thông tin và nút hành động. */
export function MediaHero({ cover, eyebrow, chip, title, description, meta, actions, className }: MediaHeroProps) {
  return (
    <header className={cn('flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:gap-9 md:text-left', className)}>
      <div className="w-[min(68vw,16rem)] shrink-0 md:w-56 lg:w-[17rem]">{cover}</div>
      <div className="flex min-w-0 flex-col items-center md:items-start">
        <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
          <span className="text-sm font-bold tracking-[0.2em] text-muted uppercase">{eyebrow}</span>
          {chip}
        </div>
        <h1 className="mt-3 text-[2.4rem] leading-[1.02] font-extrabold tracking-[-0.03em] text-balance sm:text-5xl lg:text-[4.25rem]">{title}</h1>
        {description && <div className="mt-3 max-w-xl text-[0.95rem] text-muted">{description}</div>}
        {meta && <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[1.02rem] text-muted md:justify-start">{meta}</div>}
        {actions && <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 md:justify-start">{actions}</div>}
      </div>
    </header>
  );
}

/** Nút Phát / Tạm dừng + trộn bài cho một danh sách. Tự nhận biết danh sách này có đang phát không. */
export function PlayActions({ songs, context, children }: { songs: Song[]; context: PlayContext; children?: ReactNode }) {
  const isThisContext = usePlayerStore((s) => s.context?.type === context.type && s.context?.id === context.id && s.queue.length > 0);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playSongs = usePlayerStore((s) => s.playSongs);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const playingHere = isThisContext && isPlaying;

  return (
    <>
      <Button
        variant="primary"
        size="md"
        className="h-12 px-7 sm:h-[3.75rem] sm:px-8 sm:text-[1.05rem]"
        disabled={songs.length === 0}
        onClick={() => (isThisContext ? togglePlay() : playSongs(songs, 0, context, { shuffle: false }))}
        icon={playingHere ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
      >
        {playingHere ? 'Tạm dừng' : 'Phát'}
      </Button>
      <IconButton label="Phát ngẫu nhiên" variant="glass" size="md" className={HERO_ICON} disabled={songs.length === 0} onClick={() => playSongs(songs, undefined, context, { shuffle: true })}>
        <Shuffle className="size-5" />
      </IconButton>
      {children}
    </>
  );
}

/** Kích thước nút tròn ở phần đầu trang: 44px trên điện thoại, 56px từ màn hình vừa trở lên. */
export const HERO_ICON = 'sm:size-14';

export function MetaDot() {
  return <span aria-hidden>·</span>;
}
