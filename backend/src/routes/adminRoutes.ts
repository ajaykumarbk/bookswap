import { Router } from 'express';
import {
  getAdminStats,
  getAdminUsers,
  toggleSuspendUser,
  getAdminBooks,
  adminRemoveBook,
  getAdminReports,
  resolveReport,
  getAdminAuditLogs
} from '../controllers/adminController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateToken, requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.post('/users/:id/suspend', toggleSuspendUser);
router.get('/books', getAdminBooks);
router.delete('/books/:id', adminRemoveBook);
router.get('/reports', getAdminReports);
router.post('/reports/:id/resolve', resolveReport);
router.get('/audit-logs', getAdminAuditLogs);

export default router;
