import { Router } from 'express';
import { z } from 'zod';
import { requireUser } from '../users/current-user.middleware';
import { parse } from '../../core/validate';
import type { Services } from '../services';

const id = z.string().trim().min(1).max(100);
const name = z.string().trim().min(1, 'Tên playlist không được để trống').max(80, 'Tên playlist tối đa 80 ký tự');
const description = z.string().trim().max(300, 'Mô tả tối đa 300 ký tự');

const createBody = z.object({ name, description: description.optional(), songId: id.optional() });
const updateBody = z
  .object({ name: name.optional(), description: description.optional() })
  .refine((v) => v.name !== undefined || v.description !== undefined, 'Cần ít nhất một trường để cập nhật');
const addSongBody = z.object({ songId: id });
const reorderBody = z.object({ songIds: z.array(id).max(500) });
const idParams = z.object({ id });
const songParams = z.object({ id, songId: id });

/** /api/playlists — đọc công khai; ghi yêu cầu người dùng (khách cũng được). */
export function playlistRoutes({ playlists }: Services): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await playlists.listEditorial());
  });

  router.get('/:id', async (req, res) => {
    res.json(await playlists.getDetail(parse(idParams, req.params).id, req.user?.id));
  });

  router.post('/', requireUser, async (req, res) => {
    res.status(201).json(await playlists.create(req.user!.id, parse(createBody, req.body)));
  });

  router.patch('/:id', requireUser, async (req, res) => {
    res.json(await playlists.update(req.user!.id, parse(idParams, req.params).id, parse(updateBody, req.body)));
  });

  router.delete('/:id', requireUser, async (req, res) => {
    await playlists.remove(req.user!.id, parse(idParams, req.params).id);
    res.status(204).end();
  });

  router.post('/:id/songs', requireUser, async (req, res) => {
    const { songId } = parse(addSongBody, req.body);
    res.status(201).json(await playlists.addSong(req.user!.id, parse(idParams, req.params).id, songId));
  });

  router.put('/:id/songs', requireUser, async (req, res) => {
    const { songIds } = parse(reorderBody, req.body);
    res.json(await playlists.reorder(req.user!.id, parse(idParams, req.params).id, songIds));
  });

  router.delete('/:id/songs/:songId', requireUser, async (req, res) => {
    const params = parse(songParams, req.params);
    res.json(await playlists.removeSong(req.user!.id, params.id, params.songId));
  });

  return router;
}
