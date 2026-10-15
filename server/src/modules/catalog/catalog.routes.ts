import { Router } from 'express';
import { z } from 'zod';
import { parse } from '../../core/validate';
import type { Services } from '../services';

const id = z.string().trim().min(1).max(100);
const page = {
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).default(0),
};

const songListQuery = z.object({
  artistId: id.optional(),
  albumId: id.optional(),
  moodId: id.optional(),
  genreId: id.optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(['popular', 'newest', 'title', 'track']).optional(),
  ...page,
});

const albumListQuery = z.object({
  artistId: id.optional(),
  moodId: id.optional(),
  genreId: id.optional(),
  sort: z.enum(['newest', 'title']).optional(),
  ...page,
});

const artistListQuery = z.object({
  genreId: id.optional(),
  sort: z.enum(['popular', 'name']).optional(),
  ...page,
});

const idParams = z.object({ id });

/** /api/songs, /api/albums, /api/artists, /api/moods, /api/genres */
export function catalogRoutes({ catalog }: Services): Router {
  const router = Router();

  router.get('/songs', async (req, res) => {
    res.json(await catalog.listSongs(parse(songListQuery, req.query)));
  });
  router.get('/songs/:id', async (req, res) => {
    res.json(await catalog.getSong(parse(idParams, req.params).id));
  });
  router.get('/songs/:id/lyrics', async (req, res) => {
    res.json(await catalog.getLyrics(parse(idParams, req.params).id));
  });

  router.get('/albums', async (req, res) => {
    res.json(await catalog.listAlbums(parse(albumListQuery, req.query)));
  });
  router.get('/albums/:id', async (req, res) => {
    res.json(await catalog.getAlbumDetail(parse(idParams, req.params).id));
  });

  router.get('/artists', async (req, res) => {
    res.json(await catalog.listArtists(parse(artistListQuery, req.query)));
  });
  router.get('/artists/:id', async (req, res) => {
    res.json(await catalog.getArtistDetail(parse(idParams, req.params).id));
  });

  router.get('/moods', async (_req, res) => {
    res.json(await catalog.listMoods());
  });
  router.get('/moods/:id', async (req, res) => {
    res.json(await catalog.getMoodDetail(parse(idParams, req.params).id));
  });

  router.get('/genres', async (_req, res) => {
    res.json(await catalog.listGenres());
  });
  router.get('/genres/:id', async (req, res) => {
    res.json(await catalog.getGenreDetail(parse(idParams, req.params).id));
  });

  return router;
}
