import { Request, Response, NextFunction } from 'express';
import { getBook } from '../services/book.service';
import { createBook } from '../services/book.service';
import { validateBookInput } from '../utils/bookValidation';

export const getBookInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const bookId = req.params.id; // Retrieve the `id` from the route parameter

    // bookId is a string, so we need to convert it to a number
    const id = parseInt(bookId, 10);

    const book = await getBook(id);
    // Example implementation of getBookInfo
    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    const authorName = book.author
      ? `${book.author.lastName}, ${book.author.firstName}`
      : 'Unknown Author';
    const bookData = {
      ISBN: '9780156031448',
      ASIN: '0156031442',
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

    // Respond with the book data
    res.status(200).json(bookData);
  } catch (error) {
    res.status(500).json({
      error: 'An error occurred while fetching book info.',
    });
  }
};
/**
 * Handles book creation.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The Express next function.
 */
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
