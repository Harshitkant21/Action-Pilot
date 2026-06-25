import { Router } from 'express';
import { register, login, me } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public auth endpoints
router.post('/register', register);
router.post('/login', login);

// Protected auth endpoints
router.get('/me', authenticate, me);

export default router;
