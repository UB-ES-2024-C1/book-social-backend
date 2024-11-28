import { AppDataSource } from '../config/database';
import { Book } from '../entities/Book';
import { User } from '../entities/User';
import { validate } from 'class-validator';

const bookRepository = AppDataSource.getRepository(Book);
const userRepository = AppDataSource.getRepository(User);

/**
 * Creates a new book and saves it to the database.
 *
 * @param bookData The book data containing title, author, publication date, etc.
 * @returns A Promise that resolves to an object containing the book if creation is successful, otherwise an error message.
 */
export const createBook = async (
  bookData: Partial<Book>
): Promise<{ book: Book | null; error?: string }> => {
  try {
    if (!bookData) {
      return { book: null, error: 'Book data is required' };
    }

    const book = new Book();

    // Validate author exists
    if (bookData.author) {
      try {
        const authorId =
          typeof bookData.author === 'number'
            ? bookData.author
            : (bookData.author as User).id;

        if (!authorId || typeof authorId !== 'number') {
          return { book: null, error: 'Invalid author ID format' };
        }

        const author = await userRepository.findOne({
          where: { id: authorId },
        });

        if (!author) {
          return { book: null, error: 'Author not found' };
        }
        book.author = author;
      } catch (error) {
        console.error('Error processing author:', error);
        return { book: null, error: 'Invalid author data' };
      }
    }

    if (bookData.publication_date) {
      try {
        bookData.publication_date = new Date(bookData.publication_date);
      } catch (error) {
        console.error('Error processing date:', error);
        return { book: null, error: 'Invalid publication date' };
      }
    }

    // Assign rest of the properties
    const { author, ...restBookData } = bookData;
    Object.assign(book, restBookData);

    // Validate entity
    const errors = await validate(book);
    if (errors.length > 0) {
      const validationErrors = errors
        .map((error) => Object.values(error.constraints || {}))
        .flat();
      return { book: null, error: validationErrors.join(', ') };
    }

    const savedBook = await bookRepository.save(book);
    return { book: savedBook };
  } catch (error) {
    console.error('Error creating book:', error);
    return { book: null, error: 'Error saving book to database' };
  }
};

export const getBook = async (id: number): Promise<Book | null> => {
  const book = await bookRepository.findOne({ where: { id } });
  if (!book) return null;
  return book;
};

/**
 * Fetches a list of books with optional filters for genres and ordering by publication date.
 *
 * @param filters An object containing optional filters for the books.
 * @param filters.genres An array of genres to filter books (e.g., ['Fiction', 'Non-fiction']).
 * @param filters.orderByDate A boolean indicating whether to order books by publication date.
 * @returns A Promise that resolves to an array of books with only the ID and title fields.
 */
export const getBooksList = async (
  filters: {
    genres?: string[];
    orderByDate?: boolean;
  } = {}
): Promise<{ id: number; title: string }[]> => {
  try {
    const { genres, orderByDate } = filters;

    // Build query
    const query = bookRepository
      .createQueryBuilder('book')
      .leftJoin('book.author', 'author')
      .select([
        'book.id',
        'book.title',
        'book.synopsis',
        'book.reviewValue',
        'book.image_url',
        'book.genres',
        'book.publication_date',
      ])
      .addSelect(
        "CONCAT(author.firstName, ' ', author.lastName)",
        'authorName'
      );
    // Apply genre filter if provided
    if (genres && genres.length > 0) {
      query.andWhere('book.genres && :genres', { genres }); // Checks for overlap in arrays
    }

    // Apply ordering by publication date if specified
    if (orderByDate) {
      query.orderBy('book.publication_date', 'ASC');
    }

    query.take(10);

    // Execute query
    const books = await query.getMany();

    return books;
  } catch (error) {
    console.error('Error fetching books list:', error);
    throw new Error('Unable to fetch books list.');
  }
};
