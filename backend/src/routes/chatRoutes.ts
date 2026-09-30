import { Router } from 'express';
import { getSwapMessages, sendMessage, getUserChats } from '../controllers/chatController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getUserChats);
router.get('/:swapId/messages', authenticateToken, getSwapMessages);
router.post('/:swapId/messages', authenticateToken, sendMessage);

export default router;
