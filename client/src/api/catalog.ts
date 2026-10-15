import type {
  AlbumDetail,
  ArtistDetail,
  DiscoverFeed,
  GenreDetail,
  HomeFeed,
  Lyrics,
  MoodDetail,
  Playlist,
  PlaylistDetail,
  SearchResults,
} from '@nocturne/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { qk } from './query-client';

export const useHome = () => useQuery({ queryKey: qk.home, queryFn: () => api.get<HomeFeed>('/home') });

export const useDiscover = () => useQuery({ queryKey: qk.discover, queryFn: () => api.get<DiscoverFeed>('/discover') });

export const useAlbum = (id: string) =>
  useQuery({ queryKey: qk.album(id), queryFn: () => api.get<AlbumDetail>(`/albums/${encodeURIComponent(id)}`) });

export const useArtist = (id: string) =>
  useQuery({ queryKey: qk.artist(id), queryFn: () => api.get<ArtistDetail>(`/artists/${encodeURIComponent(id)}`) });

export const useMood = (id: string) =>
  useQuery({ queryKey: qk.mood(id), queryFn: () => api.get<MoodDetail>(`/moods/${encodeURIComponent(id)}`) });

export const useGenre = (id: string) =>
  useQuery({ queryKey: qk.genre(id), queryFn: () => api.get<GenreDetail>(`/genres/${encodeURIComponent(id)}`) });

export const usePlaylist = (id: string) =>
  useQuery({ queryKey: qk.playlist(id), queryFn: () => api.get<PlaylistDetail>(`/playlists/${encodeURIComponent(id)}`) });

/** Lời bài hát (hiếm khi thay đổi → giữ cache lâu). Lỗi 404 = bài chưa có lời. */
export const useLyrics = (songId: string, enabled = true) =>
  useQuery({
    queryKey: qk.lyrics(songId),
    queryFn: () => api.get<Lyrics>(`/songs/${encodeURIComponent(songId)}/lyrics`),
    enabled,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
  });

export const useEditorialPlaylists = () =>
  useQuery({ queryKey: qk.editorialPlaylists, queryFn: () => api.get<Playlist[]>('/playlists') });

export const useSearch = (q: string) =>
  useQuery({
    queryKey: qk.search(q),
    queryFn: ({ signal }) => api.get<SearchResults>('/search', { q, limit: 20 }, signal),
    enabled: q.trim().length > 0,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
