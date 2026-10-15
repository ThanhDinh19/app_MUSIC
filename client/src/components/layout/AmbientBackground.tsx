import type { CSSProperties } from 'react';
import { useMe } from '../../api/me';
import { usePlayerStore } from '../../features/player/player.store';

const DEFAULT_MOOD = '#5cc8f0';

/** Nền gradient toàn ứng dụng. Khi bật Mood sync, góc trên nhuốm màu tâm trạng của bài đang phát. */
export function AmbientBackground() {
  const { data: me } = useMe();
  const moodColor = usePlayerStore((s) => s.queue[s.index]?.song.mood.color);
  const moodSync = me?.preferences.moodSync ?? true;
  const color = moodSync && moodColor ? moodColor : DEFAULT_MOOD;

  return <div aria-hidden className="ambient pointer-events-none fixed inset-0 -z-10" style={{ '--mood': color } as CSSProperties} />;
}
