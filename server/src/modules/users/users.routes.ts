import { Router } from 'express';
import { z } from 'zod';
import { parse } from '../../core/validate';
import type { Services } from '../services';

const updateBody = z.object({
  displayName: z.string().trim().min(1, 'Tên hiển thị không được để trống').max(40, 'Tên hiển thị tối đa 40 ký tự').optional(),
  preferences: z.object({ moodSync: z.boolean().optional() }).optional(),
});

/** /api/me (đã yêu cầu người dùng). */
export function userRoutes({ users }: Services): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json(await users.getProfile(req.user!));
  });

  router.patch('/', async (req, res) => {
    res.json(await users.updateProfile(req.user!, parse(updateBody, req.body)));
  });

  return router;
}
