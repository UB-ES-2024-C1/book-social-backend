import { AppDataSource } from '../config/database';
import { Book } from '../entities/Book';
import { User } from '../entities/User';
import { validate } from 'class-validator';
import { Like } from 'typeorm';
import { Review } from '../entities/Review';

const bookRepository = AppDataSource.getRepository(Book);
const userRepository = AppDataSource.getRepository(User);

// Basic book information for list views
export interface BookListDTO {
  id: number;
  title: string;
  genres: string[];
  author: {
    firstName: string;
    lastName: string;
  };
  shortSynopsis: string | null; // First 100 chars + "..." if needed
  reviewValue: number | null; // External platform rating
  image_url?: string;
}

// Detailed book information including reviews
export interface BookDetailDTO {
  id: number;
  title: string;
  genres: string[];
  categories?: string[];
  author: {
    id: number;
    firstName: string;
    lastName: string;
  };
  synopsis?: string;
  image_url?: string;
  publication_date: Date;
  publisher?: string;
  ISBN?: string;
  edition?: string;
  language?: string;
  num_pages?: number;
  externalRating: {
    reviewValue: number | null; // External platform rating
    ratingCount: number | null; // External platform count
  };
  reviewStats: {
    averageRating: number; // App's own rating average
    totalReviews: number; // App's total reviews
    ratingDistribution: {
      // App's rating distribution
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
  reviews: {
    id: number;
    rating: number;
    created_at: Date;
    user: {
      id: number;
      firstName: string;
      lastName: string;
    };
  }[];
}

/**
 * Retrieves detailed book information including reviews and statistics
 * @param id - Book ID to find
 * @returns Detailed book information or null if not found
 */
export const getBook = async (id: number): Promise<BookDetailDTO | null> => {
  try {
    const book = await bookRepository.findOne({
      where: { id },
      relations: ['author', 'reviews', 'reviews.user'],
    });

    if (!book) return null;

    // Calculate review statistics
    const reviews = book.reviews || [];
    const ratings = reviews.map((r) => r.rating);
    const averageRating = ratings.length
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    // Calculate rating distribution
    const distribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    ratings.forEach((rating) => {
      distribution[rating as keyof typeof distribution]++;
    });

    return {
      id: book.id,
      title: book.title,
      genres: book.genres,
      categories: book.categories,
      author: {
        id: book.author.id,
        firstName: book.author.firstName,
        lastName: book.author.lastName,
      },
      synopsis: book.synopsis,
      image_url: book.image_url,
      publication_date: book.publication_date,
      publisher: book.publisher,
      ISBN: book.ISBN,
      edition: book.edition,
      language: book.language,
      num_pages: book.num_pages,
      externalRating: {
        reviewValue: book.reviewValue ?? null,
        ratingCount: book.ratingCount ?? null,
      },
      reviewStats: {
        averageRating,
        totalReviews: reviews.length,
        ratingDistribution: distribution,
      },
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        created_at: review.created_at,
        user: {
          id: review.user.id,
          firstName: review.user.firstName,
          lastName: review.user.lastName,
        },
      })),
    };
  } catch (error) {
    console.error('Error fetching book:', error);
    return null;
  }
};

/**
 * Creates and saves a new book in the database
 * @param bookData - Book data containing title, author, publication date and other fields
 * @returns Object with created book or error message
 */
export const createBook = async (
  bookData: Partial<Book>
): Promise<{ book: BookDetailDTO | null; error?: string }> => {
  try {
    if (!bookData) {
      return { book: null, error: 'Book data is required' };
    }

    const book = new Book();

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

    if (bookData.ISBN) {
      const existingBook = await bookRepository.findOne({
        where: { ISBN: bookData.ISBN },
      });
      if (existingBook) {
        return { book: null, error: 'ISBN already exists' };
      }
    }

    Object.assign(book, bookData);

    const errors = await validate(book);
    if (errors.length > 0) {
      const validationErrors = errors
        .map((error) => Object.values(error.constraints || {}))
        .flat();
      return { book: null, error: validationErrors.join(', ') };
    }

    const savedBook = await bookRepository.save(book);
    const bookDetail = await getBook(savedBook.id);
    return { book: bookDetail };
  } catch (error) {
    console.error('Error creating book:', error);
    return { book: null, error: 'Error saving book to database' };
  }
};

/**
 * Gets a filtered list of books
 * @param filters - Optional filters for genres, ordering and limit
 * @returns Array of books with basic info (id and title)
 */
export const getBooksList = async (
  filters: {
    genres?: string[];
    orderByDate?: boolean;
    limit?: number;
  } = {}
): Promise<BookListDTO[]> => {
  try {
    const { genres, orderByDate, limit } = filters;

    const query = bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.author', 'author')
      .select([
        'book.id',
        'book.title',
        'book.synopsis',
        'book.reviewValue',
        'book.image_url',
        'book.genres',
        'author.firstName',
        'author.lastName',
      ]);

    if (genres && genres.length > 0) {
      query.andWhere('book.genres && :genres', { genres });
    }

    if (orderByDate) {
      query.orderBy('book.publication_date', 'ASC');
    }

    query.take(limit || 10);

    const books = await query.getMany();

    return books.map((book) => ({
      id: book.id,
      title: book.title,
      genres: book.genres,
      author: {
        firstName: book.author.firstName,
        lastName: book.author.lastName,
      },
      shortSynopsis: book.synopsis
        ? book.synopsis.length > 100
          ? `${book.synopsis.substring(0, 100)}...`
          : book.synopsis
        : null,
      reviewValue: book.reviewValue ?? null,
      image_url: book.image_url,
    }));
  } catch (error) {
    console.error('Error fetching books list:', error);
    throw new Error('Unable to fetch books list.');
  }
};

/**
 * Updates an existing book
 * @param bookId - ID of book to update
 * @param bookData - New book data to apply
 * @returns Updated book or error message
 */
export const updateBookById = async (
  bookId: number,
  bookData: Partial<Book>
): Promise<{ book: BookDetailDTO | null; error?: string }> => {
  try {
    const book = await bookRepository.findOne({ where: { id: bookId } });
    if (!book) {
      return { book: null, error: 'Book not found' };
    }

    if (bookData.author) {
      try {
        const authorId =
          typeof bookData.author === 'number'
            ? bookData.author
            : (bookData.author as User).id;

        const author = await userRepository.findOne({
          where: { id: authorId },
        });

        if (!author) {
          return { book: null, error: 'Author not found' };
        }
        bookData.author = author;
      } catch (error) {
        return { book: null, error: `Invalid author data: ${error}` };
      }
    }

    if (bookData.publication_date) {
      try {
        bookData.publication_date = new Date(bookData.publication_date);
      } catch (error) {
        return { book: null, error: `Invalid publication date: ${error}` };
      }
    }

    const updatedBook = bookRepository.merge(book, bookData);
    const errors = await validate(updatedBook);
    if (errors.length > 0) {
      const validationErrors = errors
        .map((error) => Object.values(error.constraints || {}))
        .flat();
      return { book: null, error: validationErrors.join(', ') };
    }

    const savedBook = await bookRepository.save(updatedBook);
    const bookDetail = await getBook(savedBook.id);
    return { book: bookDetail };
  } catch (error) {
    console.error('Error updating book:', error);
    return { book: null, error: 'Error updating book in database' };
  }
};

/**
 * Deletes a book from the database
 * @param bookId - ID of book to delete
 * @returns Success status and optional error message
 */
export const deleteBookById = async (
  bookId: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await bookRepository.delete(bookId);
    if (result.affected === 0) {
      return { success: false, error: 'Book not found' };
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting book:', error);
    return { success: false, error: 'Error deleting book from database' };
  }
};

/**
 * Searches books using various filters
 * @param searchParams - Search criteria (title, author, genre, publisher)
 * @param page - Page number for pagination
 * @param limit - Results per page
 * @returns Matching books and total count
 */
export const searchBooks = async (
  searchParams: {
    title?: string;
    authorName?: string;
    genre?: string;
    publisher?: string;
  },
  page: number = 1,
  limit: number = 10
): Promise<{ books: BookListDTO[]; total: number; error?: string }> => {
  try {
    const query = bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.author', 'author')
      .select([
        'book.id',
        'book.title',
        'book.synopsis',
        'book.genres',
        'book.publication_date',
        'book.publisher',
        'book.image_url',
        'author.id',
        'author.firstName',
        'author.lastName',
      ]);

    if (searchParams.title) {
      query.andWhere('LOWER(book.title) LIKE LOWER(:title)', {
        title: `%${searchParams.title}%`,
      });
    }

    if (searchParams.authorName) {
      query.andWhere(
        "LOWER(CONCAT(author.firstName, ' ', author.lastName)) LIKE LOWER(:authorName)",
        { authorName: `%${searchParams.authorName}%` }
      );
    }

    if (searchParams.genre) {
      query.andWhere('book.genres && ARRAY[:genre]', {
        genre: searchParams.genre,
      });
    }

    if (searchParams.publisher) {
      query.andWhere('LOWER(book.publisher) LIKE LOWER(:publisher)', {
        publisher: `%${searchParams.publisher}%`,
      });
    }

    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [books, total] = await query.getManyAndCount();

    const booksDTO = books.map((book) => ({
      id: book.id,
      title: book.title,
      genres: book.genres,
      author: {
        firstName: book.author.firstName,
        lastName: book.author.lastName,
      },
      shortSynopsis: book.synopsis
        ? book.synopsis.length > 100
          ? `${book.synopsis.substring(0, 100)}...`
          : book.synopsis
        : null,
      reviewValue: book.reviewValue ?? null,
      image_url: book.image_url,
    }));

    return { books: booksDTO, total };
  } catch (error) {
    console.error('Error searching books:', error);
    return { books: [], total: 0, error: 'Error searching books in database' };
  }
};

/**
 * Gets books filtered by genre
 * @param genre - Genre to filter by
 * @param page - Page number
 * @param limit - Results per page
 * @returns Matching books and total count
 */
export const getBooksByGenre = async (
  genre: string,
  page: number = 1,
  limit: number = 10
): Promise<{ books: Book[]; total: number; error?: string }> => {
  try {
    const [books, total] = await bookRepository.findAndCount({
      where: {
        genres: Like(`%${genre}%`),
      },
      relations: ['author'],
      skip: (page - 1) * limit,
      take: limit,
      order: {
        publication_date: 'DESC',
      },
    });

    return { books, total };
  } catch (error) {
    console.error('Error fetching books by genre:', error);
    return { books: [], total: 0, error: 'Error fetching books by genre' };
  }
};

/**
 * Gets all books by a specific author
 * @param authorId - ID of the author
 * @param page - Page number
 * @param limit - Results per page
 * @returns Author's books and total count
 */
export const getBooksByAuthor = async (
  authorId: number,
  page: number = 1,
  limit: number = 10
): Promise<{ books: Book[]; total: number; error?: string }> => {
  try {
    const [books, total] = await bookRepository.findAndCount({
      where: {
        author: { id: authorId },
      },
      relations: ['author'],
      skip: (page - 1) * limit,
      take: limit,
      order: {
        publication_date: 'DESC',
      },
    });

    return { books, total };
  } catch (error) {
    console.error('Error fetching books by author:', error);
    return { books: [], total: 0, error: 'Error fetching books by author' };
  }
};

/**
 * Gets all reviews for a specific book
 * @param bookId - ID of the book
 * @param page - Page number
 * @param limit - Results per page
 * @returns Book reviews and total count
 */
export const getBookReviews = async (
  bookId: number,
  page: number = 1,
  limit: number = 10
): Promise<{ reviews: Review[]; total: number; error?: string }> => {
  try {
    const reviewRepository = AppDataSource.getRepository(Review);

    const [reviews, total] = await reviewRepository.findAndCount({
      where: { book: { id: bookId } },
      relations: ['user'],
      select: {
        id: true,
        rating: true,
        created_at: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { reviews, total };
  } catch (error) {
    console.error('Error fetching book reviews:', error);
    return { reviews: [], total: 0, error: 'Error fetching reviews' };
  }
};

interface RatingStats {
  averageRating: number;
  totalReviews: number;
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  twoStars: number;
  oneStar: number;
}

/**
 * Gets rating statistics for a book
 * @param bookId - ID of the book
 * @returns Rating statistics or error
 */
export const getBookRatingStats = async (
  bookId: number
): Promise<{ stats: RatingStats | null; error?: string }> => {
  try {
    const stats = await AppDataSource.getRepository(Review)
      .createQueryBuilder('review')
      .where('review.bookId = :bookId', { bookId })
      .select([
        'AVG(review.rating) as averageRating',
        'COUNT(*) as totalReviews',
        'COUNT(CASE WHEN rating = 5 THEN 1 END) as fiveStars',
        'COUNT(CASE WHEN rating = 4 THEN 1 END) as fourStars',
        'COUNT(CASE WHEN rating = 3 THEN 1 END) as threeStars',
        'COUNT(CASE WHEN rating = 2 THEN 1 END) as twoStars',
        'COUNT(CASE WHEN rating = 1 THEN 1 END) as oneStar',
      ])
      .getRawOne();

    return { stats };
  } catch (error) {
    console.error('Error fetching rating stats:', error);
    return { stats: null, error: 'Error fetching rating statistics' };
  }
};

/**
 * Gets top rated books
 * @param limit - Number of books to return
 * @returns Top rated books or error
 */
export const getTopRatedBooks = async (
  limit: number = 10
): Promise<{ books: Book[]; error?: string }> => {
  try {
    const books = await bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.author', 'author')
      .where('book.reviewValue IS NOT NULL')
      .andWhere('book.ratingCount >= :minRatings', { minRatings: 5 })
      .orderBy('book.reviewValue', 'DESC')
      .take(limit)
      .getMany();

    return { books };
  } catch (error) {
    console.error('Error fetching top rated books:', error);
    return { books: [], error: 'Error fetching top rated books' };
  }
};

/**
 * Gets all available book categories
 * @returns List of unique categories or error
 */
export const getAllCategories = async (): Promise<{
  categories: string[];
  error?: string;
}> => {
  try {
    const result = await bookRepository
      .createQueryBuilder('book')
      .select('DISTINCT UNNEST(book.categories)', 'category')
      .where('book.categories IS NOT NULL')
      .getRawMany();

    const categories = result.map((r) => r.category);
    return { categories };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { categories: [], error: 'Error fetching categories' };
  }
};

/**
 * Gets all available book genres
 * @returns List of unique genres or error
 */
export const getAllGenres = async (): Promise<{
  genres: string[];
  error?: string;
}> => {
  try {
    const result = await bookRepository
      .createQueryBuilder('book')
      .select('DISTINCT UNNEST(book.genres)', 'genre')
      .where('book.genres IS NOT NULL')
      .getRawMany();

    const genres = result.map((r) => r.genre);
    return { genres };
  } catch (error) {
    console.error('Error fetching genres:', error);
    return { genres: [], error: 'Error fetching genres' };
  }
};

/**
 * Gets recently added books
 * @param days - Number of days to look back
 * @param limit - Number of books to return
 * @returns Recent books or error
 */
export const getRecentBooks = async (
  days: number = 30,
  limit: number = 10
): Promise<{ books: Book[]; error?: string }> => {
  try {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const books = await bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.author', 'author')
      .where('book.publication_date >= :date', { date })
      .orderBy('book.publication_date', 'DESC')
      .take(limit)
      .getMany();

    return { books };
  } catch (error) {
    console.error('Error fetching recent books:', error);
    return { books: [], error: 'Error fetching recent books' };
  }
};

interface BookStatistics {
  byGenre: { genre: string; count: number }[];
  byYear: { year: number; count: number }[];
  ratingsByGenre: { genre: string; avgRating: number }[];
}

/**
 * Gets book statistics including genre distribution, yearly trends and ratings
 * @returns Book statistics or error
 */
export const getBookStats = async (): Promise<{
  stats: BookStatistics | null;
  error?: string;
}> => {
  try {
    const genreStats = await bookRepository
      .createQueryBuilder('book')
      .select('UNNEST(book.genres) as genre, COUNT(*) as count')
      .groupBy('genre')
      .getRawMany();

    const yearStats = await bookRepository
      .createQueryBuilder('book')
      .select(
        'EXTRACT(YEAR FROM book.publication_date) as year, COUNT(*) as count'
      )
      .groupBy('year')
      .orderBy('year', 'DESC')
      .getRawMany();

    const ratingStats = await bookRepository
      .createQueryBuilder('book')
      .select(
        'UNNEST(book.genres) as genre, AVG(book.reviewValue) as avgRating'
      )
      .where('book.reviewValue IS NOT NULL')
      .groupBy('genre')
      .getRawMany();

    return {
      stats: {
        byGenre: genreStats,
        byYear: yearStats,
        ratingsByGenre: ratingStats,
      },
    };
  } catch (error) {
    console.error('Error fetching book statistics:', error);
    return { stats: null, error: 'Error fetching book statistics' };
  }
};
