import type { Song } from '@nocturne/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { reportPlay } from '../../api/me';
import { queryClient } from '../../api/query-client';
import { shuffleArray } from '../../lib/cn';
import { storage } from '../../lib/storage';
import { toastError } from '../ui/toast.store';
import { audioEngine } from './audio-engine';
import { useProgressStore } from './progress.store';

export interface QueueItem {
  /** Khoá duy nhất của mục trong hàng đợi (một bài có thể xuất hiện nhiều lần). */
  uid: string;
  song: Song;
}

export interface PlayContext {
  type: 'album' | 'playlist' | 'artist' | 'mood' | 'genre' | 'favorites' | 'history' | 'search' | 'home' | 'queue';
  id?: string;
  label: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
  queue: QueueItem[];
  /** Thứ tự gốc trước khi trộn bài (null khi không bật shuffle). */
  originalQueue: QueueItem[] | null;
  index: number;
  context: PlayContext | null;
  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
  muted: boolean;

  playSongs: (songs: Song[], startIndex?: number, context?: PlayContext | null, options?: { shuffle?: boolean }) => void;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  next: (auto?: boolean) => void;
  previous: () => void;
  seek: (time: number) => void;
  jumpTo: (uid: string) => void;
  playNext: (song: Song) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (uid: string) => void;
  clearUpcoming: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

const RESUME_KEY = 'nocturne:resume';
let uidCounter = 0;
const makeItem = (song: Song): QueueItem => ({ uid: `${Date.now().toString(36)}-${(uidCounter++).toString(36)}`, song });

let consecutiveErrors = 0;
let lastResumeSave = 0;

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => {
      /** Nạp bài tại `index` hiện tại vào audio engine. */
      const loadCurrent = (autoplay: boolean, startAt = 0) => {
        const { queue, index, volume, muted } = get();
        const item = queue[index];
        if (!item) return;
        useProgressStore.getState().reset(item.song.durationSec, startAt);
        audioEngine.setVolume(volume, muted);
        audioEngine.load(item.uid, item.song, { autoplay, startAt });
      };

      const goTo = (index: number, autoplay = true) => {
        set({ index, isPlaying: autoplay });
        loadCurrent(autoplay);
      };

      return {
        queue: [],
        originalQueue: null,
        index: -1,
        context: null,
        isPlaying: false,
        shuffle: false,
        repeat: 'off',
        volume: 1,
        muted: false,

        playSongs: (songs, startIndex, context = null, options) => {
          if (songs.length === 0) return;
          consecutiveErrors = 0;
          const items = songs.map(makeItem);
          const shuffle = options?.shuffle ?? get().shuffle;
          const start = startIndex ?? (shuffle ? Math.floor(Math.random() * items.length) : 0);
          if (shuffle) {
            const first = items[start]!;
            set({
              queue: [first, ...shuffleArray(items.filter((i) => i !== first))],
              originalQueue: items,
              index: 0,
              context,
              shuffle: true,
              isPlaying: true,
            });
          } else {
            set({ queue: items, originalQueue: null, index: start, context, isPlaying: true });
          }
          loadCurrent(true);
        },

        togglePlay: () => (get().isPlaying ? get().pause() : get().play()),

        play: () => {
          const item = get().queue[get().index];
          if (!item) return;
          set({ isPlaying: true });
          if (audioEngine.isLoaded(item.uid)) {
            void audioEngine.play();
          } else {
            const resume = storage.get<{ uid: string; time: number } | null>(RESUME_KEY, null);
            loadCurrent(true, resume?.uid === item.uid ? resume.time : 0);
          }
        },

        pause: () => {
          set({ isPlaying: false });
          audioEngine.pause();
        },

        next: (auto = false) => {
          const { queue, index, repeat } = get();
          if (queue.length === 0) return;
          if (auto && repeat === 'one') {
            audioEngine.seek(0);
            void audioEngine.play();
            return;
          }
          if (index < queue.length - 1) goTo(index + 1);
          else if (repeat === 'all') goTo(0);
          else if (auto) {
            // Hết hàng đợi: dừng ở đầu bài cuối.
            set({ isPlaying: false });
            audioEngine.seek(0);
          } else goTo(0, false);
        },

        previous: () => {
          const { queue, index, repeat } = get();
          if (queue.length === 0) return;
          if (audioEngine.currentTime > 3 || (index === 0 && repeat !== 'all')) {
            get().seek(0);
            return;
          }
          goTo(index > 0 ? index - 1 : queue.length - 1);
        },

        seek: (time) => {
          audioEngine.seek(time);
          useProgressStore.getState().setTime(time);
        },

        jumpTo: (uid) => {
          const index = get().queue.findIndex((i) => i.uid === uid);
          if (index >= 0) goTo(index);
        },

        playNext: (song) => {
          const { queue, index, originalQueue } = get();
          if (queue.length === 0) return get().playSongs([song], 0, { type: 'queue', label: 'Danh sách chờ' });
          const item = makeItem(song);
          const current = queue[index];
          const nextQueue = [...queue.slice(0, index + 1), item, ...queue.slice(index + 1)];
          let nextOriginal = originalQueue;
          if (originalQueue && current) {
            const pos = originalQueue.findIndex((i) => i.uid === current.uid);
            nextOriginal = [...originalQueue.slice(0, pos + 1), item, ...originalQueue.slice(pos + 1)];
          }
          set({ queue: nextQueue, originalQueue: nextOriginal });
        },

        addToQueue: (song) => {
          const { queue, originalQueue } = get();
          if (queue.length === 0) return get().playSongs([song], 0, { type: 'queue', label: 'Danh sách chờ' });
          const item = makeItem(song);
          set({ queue: [...queue, item], originalQueue: originalQueue ? [...originalQueue, item] : null });
        },

        removeFromQueue: (uid) => {
          const { queue, index, originalQueue, isPlaying } = get();
          const pos = queue.findIndex((i) => i.uid === uid);
          if (pos < 0) return;
          const nextQueue = queue.filter((i) => i.uid !== uid);
          const nextOriginal = originalQueue?.filter((i) => i.uid !== uid) ?? null;
          if (nextQueue.length === 0) {
            audioEngine.stop();
            set({ queue: [], originalQueue: null, index: -1, isPlaying: false, context: null });
            useProgressStore.getState().reset(0);
            return;
          }
          if (pos < index) {
            set({ queue: nextQueue, originalQueue: nextOriginal, index: index - 1 });
          } else if (pos === index) {
            set({ queue: nextQueue, originalQueue: nextOriginal, index: Math.min(index, nextQueue.length - 1) });
            loadCurrent(isPlaying);
          } else {
            set({ queue: nextQueue, originalQueue: nextOriginal });
          }
        },

        clearUpcoming: () => {
          const { queue, index, originalQueue } = get();
          const kept = queue.slice(0, index + 1);
          const keptIds = new Set(kept.map((i) => i.uid));
          set({ queue: kept, originalQueue: originalQueue?.filter((i) => keptIds.has(i.uid)) ?? null });
        },

        toggleShuffle: () => {
          const { shuffle, queue, index, originalQueue } = get();
          const current = queue[index];
          if (!shuffle) {
            if (!current) return set({ shuffle: true });
            const rest = queue.filter((_, i) => i !== index);
            set({ shuffle: true, originalQueue: queue, queue: [current, ...shuffleArray(rest)], index: 0 });
          } else {
            const restored = originalQueue ?? queue;
            set({
              shuffle: false,
              originalQueue: null,
              queue: restored,
              index: current ? Math.max(0, restored.findIndex((i) => i.uid === current.uid)) : -1,
            });
          }
        },

        cycleRepeat: () => {
          const order: RepeatMode[] = ['off', 'all', 'one'];
          set({ repeat: order[(order.indexOf(get().repeat) + 1) % order.length]! });
        },

        setVolume: (volume) => {
          const v = Math.min(1, Math.max(0, volume));
          set({ volume: v, muted: v === 0 });
          audioEngine.setVolume(v, v === 0);
        },

        toggleMute: () => {
          const muted = !get().muted;
          const volume = !muted && get().volume === 0 ? 0.6 : get().volume;
          set({ muted, volume });
          audioEngine.setVolume(volume, muted);
        },
      };
    },
    {
      name: 'nocturne:player',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ queue, originalQueue, index, context, shuffle, repeat, volume, muted }) => ({
        queue,
        originalQueue,
        index,
        context,
        shuffle,
        repeat,
        volume,
        muted,
      }),
      onRehydrateStorage: () => (state) => {
        // Hiển thị lại vị trí đang nghe dở (chưa tự phát — trình duyệt yêu cầu người dùng bấm Play).
        const item = state?.queue[state.index];
        if (!item) return;
        const resume = storage.get<{ uid: string; time: number } | null>(RESUME_KEY, null);
        useProgressStore.getState().reset(item.song.durationSec, resume?.uid === item.uid ? resume.time : 0);
      },
    },
  ),
);

/* -------------------- Nối audio engine ↔ store -------------------- */

function saveResume(force = false) {
  const { queue, index } = usePlayerStore.getState();
  const item = queue[index];
  if (!item) return;
  const now = Date.now();
  if (!force && now - lastResumeSave < 5000) return;
  lastResumeSave = now;
  storage.set(RESUME_KEY, { uid: item.uid, time: audioEngine.currentTime });
}

audioEngine.bind({
  onPlay: () => {
    consecutiveErrors = 0;
    usePlayerStore.setState({ isPlaying: true });
  },
  onPause: () => {
    usePlayerStore.setState({ isPlaying: false });
    saveResume(true);
  },
  onEnded: () => usePlayerStore.getState().next(true),
  onError: () => {
    const { queue, index } = usePlayerStore.getState();
    const item = queue[index];
    consecutiveErrors++;
    toastError(`Không phát được “${item?.song.title ?? 'bài hát'}”.`);
    if (consecutiveErrors < Math.min(3, queue.length) && index < queue.length - 1) {
      window.setTimeout(() => usePlayerStore.getState().next(), 800);
    } else {
      usePlayerStore.setState({ isPlaying: false });
    }
  },
  onTime: (time, duration) => {
    useProgressStore.getState().setTime(time, duration);
    saveResume();
  },
  onBuffering: (buffering) => useProgressStore.getState().setBuffering(buffering),
  onListened: (songId) => void reportPlay(queryClient, songId),
  remote: {
    play: () => usePlayerStore.getState().play(),
    pause: () => usePlayerStore.getState().pause(),
    next: () => usePlayerStore.getState().next(),
    previous: () => usePlayerStore.getState().previous(),
    seek: (time) => usePlayerStore.getState().seek(time),
  },
});

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => saveResume(true));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveResume(true);
  });
}

/* ------------------------------ Selectors ------------------------------ */

export const useCurrentItem = () => usePlayerStore((s) => s.queue[s.index] ?? null);
export const useCurrentSong = () => usePlayerStore((s) => s.queue[s.index]?.song ?? null);
export const useIsCurrentSong = (songId: string) => usePlayerStore((s) => s.queue[s.index]?.song.id === songId);
