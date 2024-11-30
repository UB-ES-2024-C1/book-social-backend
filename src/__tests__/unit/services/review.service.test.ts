const mockReviewRepository = {
  save: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
};

const mockUserRepository = {
  findOne: jest.fn(),
};

const mockBookRepository = {
  findOne: jest.fn(),
};

const mockValidate = jest.fn().mockResolvedValue([]); // Sin errores por defecto
jest.mock('class-validator', () => ({
  ...jest.requireActual('class-validator'),
  validate: mockValidate,
}));

import { Review } from '../../../entities/Review';
import { User } from '../../../entities/User';
import { Book } from '../../../entities/Book';
import { UserRole } from '../../../entities/User';
import {
  createReview,
  getReviewsByBook,
  getReviewsByUser,
  deleteReview,
} from '../../../services/review.service';

// Mock AppDataSource
jest.mock('../../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity) => {
      if (entity === Review) return mockReviewRepository;
      if (entity === User) return mockUserRepository;
      if (entity === Book) return mockBookRepository;
      return {};
    }),
  },
}));

describe('Review Service', () => {
  // Mock data
  let mockUser: User;
  let mockBook: Book;
  let mockReview: Review;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock user
    mockUser = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      username: 'johndoe',
      password: 'Password123!',
      genre: 'Science Fiction',
      description: 'Test user description',
      role: UserRole.WRITER,
    } as User;

    // Create mock book
    mockBook = {
      id: 1,
      title: 'Test Book',
      author: mockUser,
      publication_date: new Date(),
      genres: ['Fiction'],
    } as Book;

    // Create mock review
    mockReview = {
      id: 1,
      user: mockUser,
      book: mockBook,
      rating: 4.5,
      created_at: new Date(),
    } as Review;
  });

  describe('createReview', () => {
    it('should create a review successfully with valid data', async () => {
      const reviewData = {
        user: mockUser,
        book: mockBook,
        rating: 4.5,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockBookRepository.findOne.mockResolvedValue(mockBook);
      mockReviewRepository.save.mockResolvedValue(mockReview);

      const result = await createReview(reviewData);

      expect(result.review).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(mockReviewRepository.save).toHaveBeenCalled();
    });

    it('should fail if user does not exist', async () => {
      const reviewData = {
        user: { ...mockUser, id: 999 },
        book: mockBook,
        rating: 4.5,
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockBookRepository.findOne.mockResolvedValue(mockBook);

      const result = await createReview(reviewData);

      expect(result.review).toBeNull();
      expect(result.error).toBe('User not found');
      expect(mockReviewRepository.save).not.toHaveBeenCalled();
    });

    it('should fail if book does not exist', async () => {
      const reviewData = {
        user: mockUser,
        book: { ...mockBook, id: 999 },
        rating: 4.5,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockBookRepository.findOne.mockResolvedValue(null);

      const result = await createReview(reviewData);

      expect(result.review).toBeNull();
      expect(result.error).toBe('Book not found');
      expect(mockReviewRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getReviewsByBook', () => {
    it('should return all reviews for a specific book', async () => {
      const bookId = 1;
      const mockReviews = [mockReview];

      mockReviewRepository.find.mockResolvedValue(mockReviews);

      const result = await getReviewsByBook(bookId);

      expect(result.reviews).toEqual(mockReviews);
      expect(result.error).toBeUndefined();
      expect(mockReviewRepository.find).toHaveBeenCalledWith({
        where: { book: { id: bookId } },
        relations: ['user', 'book'],
      });
    });

    it('should handle empty reviews array', async () => {
      const bookId = 1;
      mockReviewRepository.find.mockResolvedValue([]);

      const result = await getReviewsByBook(bookId);

      expect(result.reviews).toEqual([]);
      expect(result.error).toBeUndefined();
    });

    it('should handle database errors', async () => {
      const bookId = 1;
      mockReviewRepository.find.mockRejectedValue(new Error('Database error'));

      const result = await getReviewsByBook(bookId);

      expect(result.reviews).toBeNull();
      expect(result.error).toBe('Error fetching reviews');
    });
  });

  describe('getReviewsByUser', () => {
    it('should return all reviews by a specific user', async () => {
      const userId = 1;
      const mockReviews = [mockReview];

      mockReviewRepository.find.mockResolvedValue(mockReviews);

      const result = await getReviewsByUser(userId);

      expect(result.reviews).toEqual(mockReviews);
      expect(result.error).toBeUndefined();
      expect(mockReviewRepository.find).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        relations: ['user', 'book'],
      });
    });

    it('should handle empty reviews array', async () => {
      const userId = 1;
      mockReviewRepository.find.mockResolvedValue([]);

      const result = await getReviewsByUser(userId);

      expect(result.reviews).toEqual([]);
      expect(result.error).toBeUndefined();
    });
  });

  describe('deleteReview', () => {
    it('should delete a review successfully', async () => {
      const reviewId = 1;
      mockReviewRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await deleteReview(reviewId);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockReviewRepository.delete).toHaveBeenCalledWith(reviewId);
    });

    it('should handle non-existent review', async () => {
      const reviewId = 999;
      mockReviewRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await deleteReview(reviewId);

      expect(result.success).toBe(false);
    });
  });
});
