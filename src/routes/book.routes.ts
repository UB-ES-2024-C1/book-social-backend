import express from 'express';
import { getBookInfo, create } from '../controllers/book.controller';
import {
  authenticateToken,
  requireWriter,
} from '../middleware/auth.middleware';

const router = express.Router();

router.get('/book-detail/:id', authenticateToken, getBookInfo);

router.post('/', authenticateToken, requireWriter, create);

export default router;
