import { Router } from 'express';
import { apiNotFound } from '../core/error-handler';
import { authRoutes } from './auth/auth.routes';
import { catalogRoutes } from './catalog/catalog.routes';
import { historyRoutes } from './history/history.routes';
import { homeRoutes } from './home/home.routes';
import { libraryRoutes } from './library/library.routes';
import { playlistRoutes } from './playlists/playlists.routes';
import { searchRoutes } from './search/search.routes';
import type { Services } from './services';
import { currentUser, requireUser } from './users/current-user.middleware';
import { userRoutes } from './users/users.routes';

/** Toàn bộ REST API, gắn tại /api. */
export function createApiRouter(services: Services): Router {
  const api = Router();

  api.use(currentUser(services.users, services.auth));

  api.get('/health', (_req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
  });

  api.use(homeRoutes(services));
  api.use(catalogRoutes(services));
  api.use(searchRoutes(services));
  api.use('/playlists', playlistRoutes(services));
  api.use('/auth', authRoutes(services));

  const me = Router();
  me.use(requireUser);
  me.use(userRoutes(services));
  me.use(libraryRoutes(services));
  me.use(historyRoutes(services));
  api.use('/me', me);

  api.use(apiNotFound);
  return api;
}
