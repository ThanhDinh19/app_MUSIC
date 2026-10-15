import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../lib/api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
    },
  },
});

/** Khoá cache tập trung — dùng chung khi đọc và khi cần làm mới sau thao tác ghi. */
export const qk = {
  home: ['home'] as const,
  discover: ['discover'] as const,
  album: (id: string) => ['album', id] as const,
  artist: (id: string) => ['artist', id] as const,
  mood: (id: string) => ['mood', id] as const,
  genre: (id: string) => ['genre', id] as const,
  playlist: (id: string) => ['playlist', id] as const,
  lyrics: (songId: string) => ['lyrics', songId] as const,
  editorialPlaylists: ['playlists', 'editorial'] as const,
  search: (q: string) => ['search', q] as const,
  me: ['me'] as const,
  libraryIds: ['me', 'library-ids'] as const,
  library: ['me', 'library'] as const,
  favorites: ['me', 'favorites'] as const,
  myPlaylists: ['me', 'playlists'] as const,
  history: ['me', 'history'] as const,
};
