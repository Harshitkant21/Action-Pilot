import { Router } from 'express';
import { createGoal, getGoals, getGoalById, updateGoal, archiveGoal } from '../controllers/goal.controller';
import { getGoalTasks } from '../controllers/task.controller';
import { getGoalProgressHistory } from '../controllers/progress.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all goal endpoints
router.use(authenticate);

router.get('/', getGoals);
router.post('/', createGoal);
router.get('/:goalId', getGoalById);
router.put('/:goalId', updateGoal);
router.delete('/:goalId', archiveGoal);
router.get('/:goalId/tasks', getGoalTasks);
router.get('/:goalId/progress', getGoalProgressHistory);

export default router;
