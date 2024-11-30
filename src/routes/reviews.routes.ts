import express from 'express';
import {
  create,
  getByBook,
  getByUser,
  remove,
} from '../controllers/review.controller';
import {
  authenticateToken,
  requireOwnership,
} from '../middleware/auth.middleware';

const router = express.Router();

router.post('/', authenticateToken, create);
router.get('/book/:bookId', authenticateToken, getByBook);
router.get('/user/:userId', authenticateToken, getByUser);
router.delete(
  '/:reviewId',
  authenticateToken,
  requireOwnership('review', 'reviewId'),
  remove
);

export default router;
