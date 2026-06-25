import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/v1/health
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

export default router;
