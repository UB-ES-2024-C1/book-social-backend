import express from 'express';
import {
  create,
  getByBook,
  getByUser,
  remove,
} from '../controllers/review.controller';

const router = express.Router();

router.post('/', create);
router.get('/book/:bookId', getByBook);
router.get('/user/:userId', getByUser);
router.delete('/:reviewId', remove);

export default router;