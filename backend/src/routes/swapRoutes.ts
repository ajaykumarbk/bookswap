import { Router } from 'express';
import {
  createSwapRequest,
  getSwaps,
  getSwapById,
  acceptSwap,
  rejectSwap,
  counterOfferSwap,
  arrangeMeetup,
  confirmMeetup,
  completeExchange,
  cancelSwap
} from '../controllers/swapController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, createSwapRequest);
router.get('/', authenticateToken, getSwaps);
router.get('/:id', authenticateToken, getSwapById);
router.post('/:id/accept', authenticateToken, acceptSwap);
router.post('/:id/reject', authenticateToken, rejectSwap);
router.post('/:id/counter', authenticateToken, counterOfferSwap);
router.post('/:id/meetup', authenticateToken, arrangeMeetup);
router.post('/:id/meetup/confirm', authenticateToken, confirmMeetup);
router.post('/:id/complete', authenticateToken, completeExchange);
router.post('/:id/cancel', authenticateToken, cancelSwap);

export default router;
