import { Request, Response } from 'express';
import { getBook, getBooksList } from '../services/book.service';
import { createBook } from '../services/book.service';
import { validateBookInput } from '../utils/bookValidation';
import {
  updateBookById,
  deleteBookById,
  searchBooks,
  getBooksByGenre,
  getBooksByAuthor,
  getBookReviews,
  getBookRatingStats,
  getTopRatedBooks,
  getAllCategories,
  getAllGenres,
  getRecentBooks,
  getBookStats,
} from '../services/book.service';

/**
 * Gets detailed information about a specific book
 * @param req Express request object containing book ID in params
 * @param res Express response object
 */
export const getBookInfo = async (req: Request, res: Response) => {
  try {
    const bookId = req.params.id;
    const id = parseInt(bookId, 10);

    const book = await getBook(id);

    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    const authorName = book.author
      ? `${book.author.lastName}, ${book.author.firstName}`
      : 'Unknown Author';
    const bookData = {
      ISBN: book.ISBN,
      language: 'English',
      published: new Date(book.publication_date).toDateString(),
      edition: 'First edition',
      title: book.title,
      image: book.image_url,
      synopsis: book.synopsis,
      genres: book.genres,
      author: authorName,
      coauthor_name: '',
      author_description:
        'lorem ipsum dolor sit amet consectetur adipiscing elit',
      good_reads_mean_rating: 4.15,
      good_reads_number_rating: 9695,
      good_reads_summary_ratings: {
        five_stars: 3949,
        four_stars: 3736,
        three_stars: 1583,
        two_stars: 325,
        one_stars: 102,
      },
    };

    res.status(200).json(bookData);
  } catch (error) {
    res.status(500).json({
      error: `An error occurred while fetching book info. ${error}`,
    });
  }
};

/**
 * Creates a new book
 * @param req Express request object containing book data in body
 * @param res Express response object
 */
export const create = async (req: Request, res: Response) => {
  try {
    const validation = validateBookInput(req.body);

    if (!validation.isValid) {
      res.status(400).json({
        message: 'Validation failed',
        errors: validation.errors,
      });
      return;
    }

    const result = await createBook(req.body);

    if (!result.book) {
      res.status(400).json({ message: result.error });
      return;
    }

    res.status(201).json({
      message: 'Book created successfully',
      book: result.book,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating book', error });
  }
};

/**
 * Gets a list of all books
 * @param req Express request object
 * @param res Express response object
 */
export const getListOfBooks = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.params.limit);
    const books = await getBooksList({limit});
    res.status(200).json(books);
  } catch {
    res.status(500).json({
      error: 'An error occurred while fetching the list of books.',
    });
  }
};

/**
 * Updates an existing book
 * @param req Express request object containing book ID in params and updated data in body
 * @param res Express response object
 */
export const updateBook = async (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.bookId);
    const { book, error } = await updateBookById(bookId, req.body);

    if (error) {
      res.status(400).json({ message: error });
      return;
    }

    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: 'Error updating book', error });
  }
};

/**
 * Deletes a book
 * @param req Express request object containing book ID in params
 * @param res Express response object
 */
export const deleteBook = async (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.bookId);
    const { success, error } = await deleteBookById(bookId);

    if (!success) {
      res.status(404).json({ message: error || 'Book not found' });
      return;
    }

    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting book', error });
  }
};

/**
 * Searches for books based on provided criteria
 * @param req Express request object containing search params in query
 * @param res Express response object
 */
export const searchBooksHandler = async (req: Request, res: Response) => {
  try {
    const { title, author, genre, publisher } = req.query;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit as string) || 10)
    );

    if (title && typeof title !== 'string') {
      res.status(400).json({ message: 'Invalid title parameter' });
      return;
    }

    const { books, total, error } = await searchBooks(
      {
        title: title as string,
        authorName: author as string,
        genre: genre as string,
        publisher: publisher as string,
      },
      page,
      limit
    );

    if (error) {
      res.status(400).json({ message: error });
      return;
    }

    res.status(200).json({
      books,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error searching books', error });
  }
};

/**
 * Gets all books of a specific genre
 * @param req Express request object containing genre in params
 * @param res Express response object
 */
export const getBooksByGenreHandler = async (req: Request, res: Response) => {
  try {
    const { genre } = req.params;
    const books = await getBooksByGenre(genre);

    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching books by genre', error });
  }
};

/**
 * Gets all books by a specific author
 * @param req Express request object containing author ID in params
 * @param res Express response object
 */
export const getBooksByAuthorHandler = async (req: Request, res: Response) => {
  try {
    const authorId = parseInt(req.params.authorId);
    const books = await getBooksByAuthor(authorId);

    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching books by author', error });
  }
};

/**
 * Gets reviews for a specific book with pagination
 * @param req Express request object containing book ID in params and page/limit in query
 * @param res Express response object
 */
export const getBookReviewsHandler = async (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.bookId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { reviews, total, error } = await getBookReviews(bookId, page, limit);

    if (error) {
      res.status(400).json({ message: error });
      return;
    }

    res.status(200).json({
      reviews,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error });
  }
};

/**
 * Gets rating statistics for a specific book
 * @param req Express request object containing book ID in params
 * @param res Express response object
 */
export const getBookRatingStatsHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const bookId = parseInt(req.params.bookId);
    const { stats, error } = await getBookRatingStats(bookId);

    if (error) {
      res.status(400).json({ message: error });
      return;
    }

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rating stats', error });
  }
};

/**
 * Gets a list of top rated books
 * @param req Express request object containing limit in query
 * @param res Express response object
 */
export const getTopRatedBooksHandler = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const { books, error } = await getTopRatedBooks(limit);

    if (error) {
      res.status(400).json({ message: error });
      return;
    }

    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching top rated books', error });
  }
};

/**
 * Gets all available book categories
 * @param req Express request object
 * @param res Express response object
 */
export const getAllCategoriesHandler = async (req: Request, res: Response) => {
  try {
    const { categories, error } = await getAllCategories();

    if (error) {
      res.status(400).json({ message: error });
      return;
    }

    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error });
  }
};

/**
 * Gets all available book genres
 * @param req Express request object
 * @param res Express response object
 */
export const getAllGenresHandler = async (req: Request, res: Response) => {
  try {
    const { genres, error } = await getAllGenres();

    if (error) {
      res.status(400).json({ message: error });
      return;
    }

    res.status(200).json(genres);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching genres', error });
  }
};

/**
 * Gets recently added books within a specified time period
 * @param req Express request object containing days and limit in query
 * @param res Express response object
 */
export const getRecentBooksHandler = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const limit = parseInt(req.query.limit as string) || 10;

    const { books, error } = await getRecentBooks(days, limit);

    if (error) {
      res.status(400).json({ message: error });
      return;
    }

    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recent books', error });
  }
};

/**
 * Gets general statistics about books in the system
 * @param req Express request object
 * @param res Express response object
 */
export const getBookStatsHandler = async (req: Request, res: Response) => {
  try {
    const { stats, error } = await getBookStats();

    if (error) {
      res.status(400).json({ message: error });
      return;
    }

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching book statistics', error });
  }
};
