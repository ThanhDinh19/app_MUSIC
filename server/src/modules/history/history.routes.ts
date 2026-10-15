import { Router } from 'express';
import { z } from 'zod';
import { parse } from '../../core/validate';
import type { Services } from '../services';

const listQuery = z.object({ limit: z.coerce.number().int().min(1).max(200).default(50) });
const recordBody = z.object({ songId: z.string().trim().min(1).max(100) });

/** /api/me/history (đã yêu cầu người dùng). */
export function historyRoutes({ history }: Services): Router {
  const router = Router();

  router.get('/history', async (req, res) => {
    res.json(await history.list(req.user!.id, parse(listQuery, req.query).limit));
  });

  router.post('/history', async (req, res) => {
    await history.record(req.user!.id, parse(recordBody, req.body).songId);
    res.status(204).end();
  });

  router.delete('/history', async (req, res) => {
    await history.clear(req.user!.id);
    res.status(204).end();
  });

  return router;
}
