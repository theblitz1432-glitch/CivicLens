import { Router } from 'express';
import { getNotifications, markAsRead, markAllRead, deleteNotification } from '../controllers/notificationController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getNotifications);
router.patch('/:id/read', protect, markAsRead);
router.patch('/read-all', protect, markAllRead);
router.delete('/:id', protect, deleteNotification);

export default router;