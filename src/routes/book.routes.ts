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
import {
  authenticateToken,
  requireWriter,
  requireOwnership,
} from '../middleware/auth.middleware';

const router = express.Router();

// Existing routes
router.get('/book-detail/:id', authenticateToken, getBookInfo);
router.get('/book-list/:limit?', authenticateToken, getListOfBooks);
router.post('/', authenticateToken, requireWriter, create);

// New CRUD routes
router.put(
  '/:bookId',
  authenticateToken,
  requireWriter,
  requireOwnership('book', 'bookId'),
  updateBook
);
router.delete(
  '/:bookId',
  authenticateToken,
  requireWriter,
  requireOwnership('book', 'bookId'),
  deleteBook
);

// New search and filter routes
router.get('/search', authenticateToken, searchBooksHandler);
router.get('/genre/:genre', authenticateToken, getBooksByGenreHandler);
router.get('/author/:authorId', authenticateToken, getBooksByAuthorHandler);

// Reviews and Ratings routes
router.get('/:bookId/reviews', authenticateToken, getBookReviewsHandler);
router.get(
  '/:bookId/rating-stats',
  authenticateToken,
  getBookRatingStatsHandler
);
router.get('/top-rated', authenticateToken, getTopRatedBooksHandler);

// Categorization routes
router.get('/categories', authenticateToken, getAllCategoriesHandler);
router.get('/genres', getAllGenresHandler);
router.get('/recent', authenticateToken, getRecentBooksHandler);

// Statistics routes
router.get('/stats', authenticateToken, getBookStatsHandler);

export default router;
