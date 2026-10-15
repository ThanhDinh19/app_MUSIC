import type {
  CreatePlaylistInput,
  HistoryEntry,
  LibraryIds,
  LibraryOverview,
  Playlist,
  Song,
  UpdatePlaylistInput,
  UpdateProfileInput,
  UserProfile,
} from '@nocturne/shared';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast, toastError } from '../features/ui/toast.store';
import { api, errorMessage } from '../lib/api';
import { qk } from './query-client';

/* ------------------------------- Hồ sơ ------------------------------- */

export const useMe = () => useQuery({ queryKey: qk.me, queryFn: () => api.get<UserProfile>('/me'), staleTime: Infinity });

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => api.patch<UserProfile>('/me', input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: qk.me });
      const previous = qc.getQueryData<UserProfile>(qk.me);
      if (previous) {
        qc.setQueryData<UserProfile>(qk.me, {
          ...previous,
          displayName: input.displayName ?? previous.displayName,
          preferences: { ...previous.preferences, ...input.preferences },
        });
      }
      return { previous };
    },
    onError: (error, _input, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.me, ctx.previous);
      toastError(errorMessage(error));
    },
    onSuccess: (profile) => qc.setQueryData(qk.me, profile),
  });
}

/* ------------------------------ Thư viện ------------------------------ */

const EMPTY_IDS: LibraryIds = { favoriteSongIds: [], savedAlbumIds: [], followedArtistIds: [] };

export const useLibraryIds = () =>
  useQuery({ queryKey: qk.libraryIds, queryFn: () => api.get<LibraryIds>('/me/library/ids'), placeholderData: EMPTY_IDS });

export const useLibrary = () => useQuery({ queryKey: qk.library, queryFn: () => api.get<LibraryOverview>('/me/library') });

export const useFavorites = () => useQuery({ queryKey: qk.favorites, queryFn: () => api.get<Song[]>('/me/favorites') });

export const useMyPlaylists = () => useQuery({ queryKey: qk.myPlaylists, queryFn: () => api.get<Playlist[]>('/me/playlists') });

export const useHistory = () =>
  useQuery({ queryKey: qk.history, queryFn: () => api.get<HistoryEntry[]>('/me/history', { limit: 200 }) });

type IdsKey = keyof LibraryIds;

/** Bật/tắt một mục trong thư viện (yêu thích, lưu album, theo dõi) với cập nhật lạc quan. */
function useLibraryToggle(key: IdsKey, path: string, messages: { on: string; off: string }, extraInvalidate: (qc: QueryClient, id: string) => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) =>
      on ? api.put<void>(`/me/${path}/${encodeURIComponent(id)}`) : api.delete<void>(`/me/${path}/${encodeURIComponent(id)}`),
    onMutate: async ({ id, on }) => {
      await qc.cancelQueries({ queryKey: qk.libraryIds });
      const previous = qc.getQueryData<LibraryIds>(qk.libraryIds);
      const base = previous ?? EMPTY_IDS;
      const list = base[key].filter((x) => x !== id);
      qc.setQueryData<LibraryIds>(qk.libraryIds, { ...base, [key]: on ? [id, ...list] : list });
      return { previous };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.libraryIds, ctx.previous);
      toastError(errorMessage(error));
    },
    onSuccess: (_data, { on }) => toast(on ? messages.on : messages.off),
    onSettled: (_data, _error, { id }) => {
      void qc.invalidateQueries({ queryKey: qk.libraryIds });
      void qc.invalidateQueries({ queryKey: qk.library });
      extraInvalidate(qc, id);
    },
  });
}

export const useToggleFavorite = () =>
  useLibraryToggle('favoriteSongIds', 'favorites', { on: 'Đã thêm vào Bài hát đã thích', off: 'Đã bỏ khỏi Bài hát đã thích' }, (qc) => {
    void qc.invalidateQueries({ queryKey: qk.favorites });
  });

export const useToggleSaveAlbum = () =>
  useLibraryToggle('savedAlbumIds', 'albums', { on: 'Đã lưu album vào Thư viện', off: 'Đã xoá album khỏi Thư viện' }, () => {});

export const useToggleFollow = () =>
  useLibraryToggle('followedArtistIds', 'artists', { on: 'Đã theo dõi nghệ sĩ', off: 'Đã bỏ theo dõi' }, (qc, id) => {
    void qc.invalidateQueries({ queryKey: qk.artist(id) });
  });

/* ------------------------------ Playlist ------------------------------ */

function invalidatePlaylists(qc: QueryClient, id?: string) {
  void qc.invalidateQueries({ queryKey: qk.myPlaylists });
  void qc.invalidateQueries({ queryKey: qk.library });
  if (id) void qc.invalidateQueries({ queryKey: qk.playlist(id) });
}

export function useCreatePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlaylistInput) => api.post<Playlist>('/playlists', input),
    onSuccess: (playlist) => {
      invalidatePlaylists(qc, playlist.id);
      toast(`Đã tạo playlist “${playlist.name}”`);
    },
    onError: (error) => toastError(errorMessage(error)),
  });
}

export function useUpdatePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePlaylistInput }) => api.patch<Playlist>(`/playlists/${id}`, input),
    onSuccess: (playlist) => {
      invalidatePlaylists(qc, playlist.id);
      toast('Đã lưu thay đổi');
    },
    onError: (error) => toastError(errorMessage(error)),
  });
}

export function useDeletePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/playlists/${id}`),
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: qk.playlist(id) });
      invalidatePlaylists(qc);
      toast('Đã xoá playlist');
    },
    onError: (error) => toastError(errorMessage(error)),
  });
}

export function useAddToPlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, songId }: { playlistId: string; songId: string }) =>
      api.post<Playlist>(`/playlists/${playlistId}/songs`, { songId }),
    onSuccess: (playlist) => {
      invalidatePlaylists(qc, playlist.id);
      toast(`Đã thêm vào “${playlist.name}”`);
    },
    onError: (error) => toastError(errorMessage(error)),
  });
}

export function useRemoveFromPlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, songId }: { playlistId: string; songId: string }) =>
      api.delete<Playlist>(`/playlists/${playlistId}/songs/${songId}`),
    onSuccess: (playlist) => {
      invalidatePlaylists(qc, playlist.id);
      toast('Đã xoá khỏi playlist');
    },
    onError: (error) => toastError(errorMessage(error)),
  });
}

export function useReorderPlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, songIds }: { playlistId: string; songIds: string[] }) =>
      api.put<Playlist>(`/playlists/${playlistId}/songs`, { songIds }),
    onSettled: (_d, _e, { playlistId }) => invalidatePlaylists(qc, playlistId),
    onError: (error) => toastError(errorMessage(error)),
  });
}

/* ------------------------------- Lịch sử ------------------------------- */

export function useClearHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<void>('/me/history'),
    onSuccess: () => {
      qc.setQueryData(qk.history, []);
      void qc.invalidateQueries({ queryKey: qk.library });
      void qc.invalidateQueries({ queryKey: qk.home });
      toast('Đã xoá lịch sử nghe');
    },
    onError: (error) => toastError(errorMessage(error)),
  });
}

/** Ghi nhận lượt nghe (gọi từ trình phát, ngoài React). */
export async function reportPlay(qc: QueryClient, songId: string): Promise<void> {
  try {
    await api.post<void>('/me/history', { songId });
    void qc.invalidateQueries({ queryKey: qk.history });
    void qc.invalidateQueries({ queryKey: qk.library });
  } catch {
    /* lỗi mạng khi ghi lịch sử không ảnh hưởng việc nghe nhạc */
  }
}
