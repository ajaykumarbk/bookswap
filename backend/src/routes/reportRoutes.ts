import { Router } from 'express';
import { createReport } from '../controllers/reportController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, createReport);

export default router;
