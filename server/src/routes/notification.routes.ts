import { Router } from 'express';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead,
  subscribe,
  getVapidPublicKey
} from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /api/v1/notifications/vapid-public-key
router.get('/vapid-public-key', getVapidPublicKey);

// POST /api/v1/notifications/subscribe
router.post('/subscribe', subscribe);

// GET /api/v1/notifications
router.get('/', getNotifications);

// POST /api/v1/notifications/read-all
router.post('/read-all', markAllAsRead);

// PATCH /api/v1/notifications/:notificationId/read
router.patch('/:notificationId/read', markAsRead);

export default router;
