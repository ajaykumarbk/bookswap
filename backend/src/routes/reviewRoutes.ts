import { Router } from 'express';
import { createReview, getUserReviews } from '../controllers/reviewController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, createReview);
router.get('/user/:id', getUserReviews);

export default router;
