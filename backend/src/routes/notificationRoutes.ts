import { Router } from 'express';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getNotifications);
router.post('/read-all', authenticateToken, markAllNotificationsRead);
router.put('/:id/read', authenticateToken, markNotificationRead);

export default router;
