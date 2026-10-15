import { Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from 'lucide-react';
import type { CSSProperties } from 'react';
import { IconButton } from '../../../components/ui/Button';
import { cn } from '../../../lib/cn';
import { usePlayerStore } from '../player.store';
import { useProgressStore } from '../progress.store';

/** Nút Phát/Tạm dừng tròn, có vòng xoay khi đang tải. */
export function PlayPauseButton({ size = 'lg', className }: { size?: 'md' | 'lg' | 'xl'; className?: string }) {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const buffering = useProgressStore((s) => s.buffering);
  const icon = size === 'xl' ? 'size-8' : size === 'lg' ? 'size-6' : 'size-5';
  return (
    <IconButton
      label={isPlaying ? 'Tạm dừng' : 'Phát'}
      variant="primary"
      size={size}
      className={cn('shadow-[0_12px_30px_-8px_rgb(255_255_255/0.45)]', className)}
      onClick={(e) => {
        e.stopPropagation();
        togglePlay();
      }}
    >
      {isPlaying && buffering && <span className="absolute inset-[-3px] animate-spin rounded-full border-2 border-transparent border-t-accent" />}
      {isPlaying ? <Pause className={cn(icon, 'fill-current')} /> : <Play className={cn(icon, 'ml-0.5 fill-current')} />}
    </IconButton>
  );
}

export function PlayerControls({ size = 'full', className }: { size?: 'full' | 'bar'; className?: string }) {
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const full = size === 'full';
  const iconSize = full ? 'size-7' : 'size-5';
  const sideSize = full ? 'size-[1.35rem]' : 'size-[1.1rem]';
  const repeatLabel = repeat === 'off' ? 'Bật lặp lại' : repeat === 'all' ? 'Lặp một bài' : 'Tắt lặp lại';

  return (
    <div className={cn('flex items-center', full ? 'justify-between' : 'justify-center gap-4', className)}>
      <IconButton label={shuffle ? 'Tắt trộn bài' : 'Trộn bài'} size={full ? 'md' : 'sm'} active={shuffle} onClick={toggleShuffle}>
        <Shuffle className={sideSize} />
        {shuffle && <Dot />}
      </IconButton>
      <IconButton label="Bài trước" size={full ? 'lg' : 'md'} onClick={previous}>
        <SkipBack className={cn(iconSize, 'fill-current')} />
      </IconButton>
      <PlayPauseButton size={full ? 'xl' : 'md'} />
      <IconButton label="Bài tiếp theo" size={full ? 'lg' : 'md'} onClick={() => next()}>
        <SkipForward className={cn(iconSize, 'fill-current')} />
      </IconButton>
      <IconButton label={repeatLabel} size={full ? 'md' : 'sm'} active={repeat !== 'off'} onClick={cycleRepeat}>
        {repeat === 'one' ? <Repeat1 className={sideSize} /> : <Repeat className={sideSize} />}
        {repeat !== 'off' && <Dot />}
      </IconButton>
    </div>
  );
}

function Dot() {
  return <span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-accent" />;
}

/** Âm lượng (chỉ hiện trên máy tính — iOS không cho web chỉnh âm lượng). */
export function VolumeControl({ className }: { className?: string }) {
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const effective = muted ? 0 : volume;
  const Icon = effective === 0 ? VolumeX : effective < 0.5 ? Volume1 : Volume2;
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <IconButton label={muted ? 'Bật tiếng' : 'Tắt tiếng'} size="sm" onClick={toggleMute}>
        <Icon className="size-5" />
      </IconButton>
      <input
        type="range"
        className="range w-24"
        aria-label="Âm lượng"
        min={0}
        max={1}
        step={0.01}
        value={effective}
        style={{ '--progress': `${effective * 100}%` } as CSSProperties}
        onChange={(e) => setVolume(Number(e.target.value))}
      />
    </div>
  );
}
