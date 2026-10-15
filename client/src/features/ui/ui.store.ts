import type { Playlist, Song } from '@nocturne/shared';
import { create } from 'zustand';
import { storage } from '../../lib/storage';

export interface SongSheetContext {
  /** Playlist (của người dùng) đang chứa bài hát → hiện thêm "Xoá khỏi playlist". */
  playlistId?: string;
  /** Mục trong danh sách chờ → hiện "Xoá khỏi danh sách chờ". */
  queueUid?: string;
}

export type PlaylistForm = { mode: 'create'; songId?: string } | { mode: 'edit'; playlist: Playlist };

const LYRICS_KEY = 'nocturne:lyrics-open';

interface UiState {
  songSheet: { song: Song; context: SongSheetContext } | null;
  addToPlaylistSong: Song | null;
  playlistForm: PlaylistForm | null;
  /** Bảng xem lời của một bài bất kỳ (không nhất thiết đang phát). */
  lyricsSheetSong: Song | null;
  /** Trình phát toàn màn hình đang hiện lời bài hát (thay cho ảnh bìa / danh sách chờ). Được ghi nhớ. */
  lyricsOpen: boolean;
  openSongSheet: (song: Song, context?: SongSheetContext) => void;
  closeSongSheet: () => void;
  openAddToPlaylist: (song: Song) => void;
  closeAddToPlaylist: () => void;
  openPlaylistForm: (form: PlaylistForm) => void;
  closePlaylistForm: () => void;
  openLyricsSheet: (song: Song) => void;
  closeLyricsSheet: () => void;
  setLyricsOpen: (open: boolean) => void;
}

/** Trạng thái các bảng (bottom sheet) và chế độ hiển thị dùng chung toàn ứng dụng. */
export const useUiStore = create<UiState>((set) => ({
  songSheet: null,
  addToPlaylistSong: null,
  playlistForm: null,
  lyricsSheetSong: null,
  lyricsOpen: storage.get(LYRICS_KEY, false),
  openSongSheet: (song, context = {}) => set({ songSheet: { song, context } }),
  closeSongSheet: () => set({ songSheet: null }),
  openAddToPlaylist: (song) => set({ addToPlaylistSong: song, songSheet: null }),
  closeAddToPlaylist: () => set({ addToPlaylistSong: null }),
  openPlaylistForm: (form) => set({ playlistForm: form, songSheet: null, addToPlaylistSong: null }),
  closePlaylistForm: () => set({ playlistForm: null }),
  openLyricsSheet: (song) => set({ lyricsSheetSong: song, songSheet: null }),
  closeLyricsSheet: () => set({ lyricsSheetSong: null }),
  setLyricsOpen: (open) => {
    storage.set(LYRICS_KEY, open);
    set({ lyricsOpen: open });
  },
}));
