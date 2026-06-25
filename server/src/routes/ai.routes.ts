import { Router } from 'express';
import { 
  analyzeGoalEndpoint, 
  generatePlanEndpoint,
  evaluateRiskEndpoint,
  standupEndpoint
} from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// POST /api/v1/ai/analyze-goal
router.post('/analyze-goal', analyzeGoalEndpoint);

// POST /api/v1/ai/generate-plan
router.post('/generate-plan', generatePlanEndpoint);

// POST /api/v1/ai/evaluate-risk
router.post('/evaluate-risk', evaluateRiskEndpoint);

// POST /api/v1/ai/standup
router.post('/standup', standupEndpoint);

export default router;
