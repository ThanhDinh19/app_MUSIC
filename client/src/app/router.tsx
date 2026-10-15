import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import { AppShell } from '../components/layout/AppShell';
import HomePage from '../pages/HomePage';

// Các trang còn lại tải khi cần (code splitting) để lần mở app đầu tiên nhanh hơn.
const DiscoverPage = lazy(() => import('../pages/DiscoverPage'));
const SearchPage = lazy(() => import('../pages/SearchPage'));
const LibraryPage = lazy(() => import('../pages/LibraryPage'));
const FavoritesPage = lazy(() => import('../pages/FavoritesPage'));
const HistoryPage = lazy(() => import('../pages/HistoryPage'));
const AlbumPage = lazy(() => import('../pages/AlbumPage'));
const ArtistPage = lazy(() => import('../pages/ArtistPage'));
const PlaylistPage = lazy(() => import('../pages/PlaylistPage'));
const MoodPage = lazy(() => import('../pages/MoodPage'));
const GenrePage = lazy(() => import('../pages/GenrePage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const LoginCallbackPage = lazy(() => import('../pages/LoginCallbackPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'discover', element: <DiscoverPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'library', element: <LibraryPage /> },
      { path: 'library/favorites', element: <FavoritesPage /> },
      { path: 'library/history', element: <HistoryPage /> },
      { path: 'album/:id', element: <AlbumPage /> },
      { path: 'artist/:id', element: <ArtistPage /> },
      { path: 'playlist/:id', element: <PlaylistPage /> },
      { path: 'mood/:id', element: <MoodPage /> },
      { path: 'genre/:id', element: <GenrePage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'login/callback', element: <LoginCallbackPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
