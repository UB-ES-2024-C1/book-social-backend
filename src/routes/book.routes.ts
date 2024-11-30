import express from 'express';
import { getBookInfo, create } from '../controllers/book.controller';
import {
  authenticateToken,
  requireWriter,
} from '../middleware/auth.middleware';
import { getListOfBooks } from '../controllers/book.controller';

const router = express.Router();

router.get('/book-detail/:id', authenticateToken, getBookInfo);
router.post('/book-list/', authenticateToken, getListOfBooks);
router.post('/', authenticateToken, requireWriter, create);

export default router;
