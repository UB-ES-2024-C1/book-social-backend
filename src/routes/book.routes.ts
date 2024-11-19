import express from 'express';
import { getBookInfo, create } from '../controllers/book.controller';
const router = express.Router();

router.get('/book-detail/:id', getBookInfo);
router.post('/', create);

export default router;
