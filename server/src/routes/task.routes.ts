import { Router } from 'express';
import { updateTaskStatus, updateTaskProgress } from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// PATCH /api/v1/tasks/:taskId/status
router.patch('/:taskId/status', updateTaskStatus);

// PATCH /api/v1/tasks/:taskId/progress
router.patch('/:taskId/progress', updateTaskProgress);

export default router;
