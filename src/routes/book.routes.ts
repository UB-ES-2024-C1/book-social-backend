import express from 'express';
import { getBookInfo } from '../controllers/book.controller';

const router = express.Router();

router.get('/book-detail/:id', getBookInfo);

export default router;
