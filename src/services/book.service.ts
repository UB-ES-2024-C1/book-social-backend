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
    Object.assign(book, bookData);

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
