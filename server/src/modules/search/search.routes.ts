import { Router } from 'express';
import { z } from 'zod';
import { parse } from '../../core/validate';
import type { Services } from '../services';

const searchQuery = z.object({
  q: z.string().trim().max(100).default(''),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** /api/search?q=... */
export function searchRoutes({ search }: Services): Router {
  const router = Router();

  router.get('/search', async (req, res) => {
    const { q, limit } = parse(searchQuery, req.query);
    res.json(await search.search(q, limit, req.user));
  });

  return router;
}
