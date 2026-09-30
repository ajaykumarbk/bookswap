import { Router } from 'express';
import {
  createBook,
  getBooks,
  getNearbyBooks,
  getRecommended,
  getBookById,
  updateBook,
  deleteBook,
  lookupISBN
} from '../controllers/bookController';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth';

const router = Router();

router.get('/nearby', getNearbyBooks);
router.get('/recommended', optionalAuthenticateToken, getRecommended);
router.get('/isbn/:isbn', lookupISBN);

router.post('/', authenticateToken, createBook);
router.get('/', optionalAuthenticateToken, getBooks);
router.get('/:id', optionalAuthenticateToken, getBookById);
router.put('/:id', authenticateToken, updateBook);
router.delete('/:id', authenticateToken, deleteBook);

export default router;
