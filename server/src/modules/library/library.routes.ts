import { Router } from 'express';
import { z } from 'zod';
import { parse } from '../../core/validate';
import type { Services } from '../services';

const id = z.string().trim().min(1).max(100);

/** /api/me/library, /api/me/favorites, /api/me/albums, /api/me/artists, /api/me/playlists (đã yêu cầu người dùng). */
export function libraryRoutes({ library, playlists }: Services): Router {
  const router = Router();

  router.get('/library', async (req, res) => {
    res.json(await library.getOverview(req.user!.id));
  });
  router.get('/library/ids', async (req, res) => {
    res.json(await library.getIds(req.user!.id));
  });

  router.get('/favorites', async (req, res) => {
    res.json(await library.listFavorites(req.user!.id));
  });
  router.put('/favorites/:songId', async (req, res) => {
    await library.addFavorite(req.user!.id, parse(z.object({ songId: id }), req.params).songId);
    res.status(204).end();
  });
  router.delete('/favorites/:songId', async (req, res) => {
    await library.removeFavorite(req.user!.id, parse(z.object({ songId: id }), req.params).songId);
    res.status(204).end();
  });

  router.get('/albums', async (req, res) => {
    res.json(await library.listSavedAlbums(req.user!.id));
  });
  router.put('/albums/:albumId', async (req, res) => {
    await library.saveAlbum(req.user!.id, parse(z.object({ albumId: id }), req.params).albumId);
    res.status(204).end();
  });
  router.delete('/albums/:albumId', async (req, res) => {
    await library.unsaveAlbum(req.user!.id, parse(z.object({ albumId: id }), req.params).albumId);
    res.status(204).end();
  });

  router.get('/artists', async (req, res) => {
    res.json(await library.listFollowedArtists(req.user!.id));
  });
  router.put('/artists/:artistId', async (req, res) => {
    await library.followArtist(req.user!.id, parse(z.object({ artistId: id }), req.params).artistId);
    res.status(204).end();
  });
  router.delete('/artists/:artistId', async (req, res) => {
    await library.unfollowArtist(req.user!.id, parse(z.object({ artistId: id }), req.params).artistId);
    res.status(204).end();
  });

  router.get('/playlists', async (req, res) => {
    res.json(await playlists.listByOwner(req.user!.id));
  });

  return router;
}
