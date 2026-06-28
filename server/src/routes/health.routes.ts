import { Router, Request, Response } from 'express';
import { appConfig } from '../config/appConfig';

const router = Router();

// GET /api/v1/health
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: appConfig.nodeEnv,
  });
});

export default router;
