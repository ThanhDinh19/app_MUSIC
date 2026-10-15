import { create } from 'zustand';

interface ProgressState {
  currentTime: number;
  duration: number;
  buffering: boolean;
  setTime: (currentTime: number, duration?: number) => void;
  setBuffering: (buffering: boolean) => void;
  reset: (duration: number, currentTime?: number) => void;
}

/**
 * Tiến độ phát (cập nhật ~4 lần/giây). Tách riêng khỏi player.store để:
 *  - chỉ thanh tua/thời gian re-render, không phải cả danh sách;
 *  - không ghi localStorage liên tục.
 */
export const useProgressStore = create<ProgressState>((set) => ({
  currentTime: 0,
  duration: 0,
  buffering: false,
  setTime: (currentTime, duration) => set((s) => ({ currentTime, duration: duration || s.duration })),
  setBuffering: (buffering) => set({ buffering }),
  reset: (duration, currentTime = 0) => set({ duration, currentTime, buffering: false }),
}));
