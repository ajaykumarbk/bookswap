import { Router } from 'express';
import { updateProfile, getUserPublicProfile, blockUser } from '../controllers/userController';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth';

const router = Router();

router.put('/me', authenticateToken, updateProfile);
router.get('/:id', optionalAuthenticateToken, getUserPublicProfile);
router.post('/:id/block', authenticateToken, blockUser);

export default router;
