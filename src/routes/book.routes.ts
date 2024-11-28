import express from 'express';
import {
  getBookInfo,
  getListOfBooks,
  create,
} from '../controllers/book.controller';
const router = express.Router();

router.get('/book-detail/:id', getBookInfo);
router.post('/book-list/', getListOfBooks);
router.post('/', create);

export default router;
