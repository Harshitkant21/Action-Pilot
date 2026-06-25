import { Router } from 'express';
import { createProgressUpdate } from '../controllers/progress.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// POST /api/v1/progress
router.post('/', createProgressUpdate);

export default router;
