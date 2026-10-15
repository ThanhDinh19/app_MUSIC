import { Router } from 'express';
import type { Services } from '../services';

/** /api/home, /api/discover */
export function homeRoutes({ home }: Services): Router {
  const router = Router();

  router.get('/home', async (req, res) => {
    res.json(await home.getHome(req.user));
  });

  router.get('/discover', async (_req, res) => {
    res.json(await home.getDiscover());
  });

  return router;
}
