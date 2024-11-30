import express from 'express';
import {
  getBookInfo,
  getListOfBooks,
  create,
  updateBook,
  deleteBook,
  searchBooksHandler,
  getBooksByGenreHandler,
  getBooksByAuthorHandler,
  getBookReviewsHandler,
  getBookRatingStatsHandler,
  getTopRatedBooksHandler,
  getAllCategoriesHandler,
  getAllGenresHandler,
  getRecentBooksHandler,
  getBookStatsHandler,
} from '../controllers/book.controller';

const router = express.Router();

// Existing routes
router.get('/book-detail/:bookId', getBookInfo);
router.get('/', getListOfBooks);
router.post('/', create);

// New CRUD routes
router.put('/:bookId', updateBook);
router.delete('/:bookId', deleteBook);

// New search and filter routes
router.get('/search', searchBooksHandler);
router.get('/genre/:genre', getBooksByGenreHandler);
router.get('/author/:authorId', getBooksByAuthorHandler);

// Reviews and Ratings routes
router.get('/:bookId/reviews', getBookReviewsHandler);
router.get('/:bookId/rating-stats', getBookRatingStatsHandler);
router.get('/top-rated', getTopRatedBooksHandler);

// Categorization routes
router.get('/categories', getAllCategoriesHandler);
router.get('/genres', getAllGenresHandler);
router.get('/recent', getRecentBooksHandler);

// Statistics routes
router.get('/stats', getBookStatsHandler);

export default router;
