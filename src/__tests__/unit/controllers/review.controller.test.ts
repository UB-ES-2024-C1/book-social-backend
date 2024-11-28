import { Request, Response } from 'express';
import {
  create,
  getByBook,
  getByUser,
  remove,
} from '../../../controllers/review.controller';
import * as reviewService from '../../../services/review.service';
import { Review } from '../../../entities/Review';
import { User } from '../../../entities/User';
import { Book } from '../../../entities/Book';
import { UserRole } from '../../../entities/User';

// Mock review service
jest.mock('../../../services/review.service');

describe('Review Controller', () => {
  // Setup for request, response
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  // Mock data
  let mockUser: User;
  let mockBook: Book;
  let mockReview: Review;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Create mock data
    mockUser = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      username: 'johndoe',
      role: UserRole.WRITER,
    } as User;

    mockBook = {
      id: 1,
      title: 'Test Book',
      author: mockUser,
      publication_date: new Date(),
      genres: ['Fiction'],
    } as Book;

    mockReview = {
      id: 1,
      user: mockUser,
      book: mockBook,
      rating: 4.5,
      created_at: new Date(),
    } as Review;
  });

  describe('create', () => {
    beforeEach(() => {
      mockRequest = {
        body: {
          user: 1,
          book: 1,
          rating: 4.5,
        },
      };
    });

    it('should create a review successfully', async () => {
      const mockServiceResponse = { review: mockReview };
      (reviewService.createReview as jest.Mock).mockResolvedValue(
        mockServiceResponse
      );

      await create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Review created successfully',
        review: mockReview,
      });
    });

    it('should handle validation errors', async () => {
      mockRequest.body = {};
      const mockServiceResponse = { review: null, error: 'Validation failed' };
      (reviewService.createReview as jest.Mock).mockResolvedValue(
        mockServiceResponse
      );

      await create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Validation failed',
      });
    });

    it('should handle server errors', async () => {
      (reviewService.createReview as jest.Mock).mockRejectedValue(
        new Error('Server error')
      );

      await create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error creating review',
        error: expect.any(Error),
      });
    });
  });

  describe('getByBook', () => {
    beforeEach(() => {
      mockRequest = {
        params: { bookId: '1' },
      };
    });

    it('should return reviews for a book successfully', async () => {
      const mockReviews = [mockReview];
      (reviewService.getReviewsByBook as jest.Mock).mockResolvedValue({
        reviews: mockReviews,
      });

      await getByBook(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ reviews: mockReviews });
    });

    it('should handle case when no reviews exist', async () => {
      (reviewService.getReviewsByBook as jest.Mock).mockResolvedValue({
        reviews: [],
      });

      await getByBook(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ reviews: [] });
    });

    it('should handle invalid bookId parameter', async () => {
      mockRequest.params = { bookId: 'invalid' };

      await getByBook(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid book ID',
      });
    });

    it('should handle service errors', async () => {
      (reviewService.getReviewsByBook as jest.Mock).mockRejectedValue(
        new Error('Service error')
      );

      await getByBook(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error fetching reviews',
        error: expect.any(Error),
      });
    });
  });

  describe('getByUser', () => {
    beforeEach(() => {
      mockRequest = {
        params: { userId: '1' },
      };
    });

    it('should return reviews for a user successfully', async () => {
      const mockReviews = [mockReview];
      (reviewService.getReviewsByUser as jest.Mock).mockResolvedValue({
        reviews: mockReviews,
      });

      await getByUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ reviews: mockReviews });
    });

    it('should handle case when no reviews exist', async () => {
      (reviewService.getReviewsByUser as jest.Mock).mockResolvedValue({
        reviews: [],
      });

      await getByUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ reviews: [] });
    });

    it('should handle invalid userId parameter', async () => {
      mockRequest.params = { userId: 'invalid' };

      await getByUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid user ID',
      });
    });

    it('should handle service errors', async () => {
      (reviewService.getReviewsByUser as jest.Mock).mockRejectedValue(
        new Error('Service error')
      );

      await getByUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error fetching reviews',
        error: expect.any(Error),
      });
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      mockRequest = {
        params: { reviewId: '1' },
      };
    });

    it('should delete a review successfully', async () => {
      (reviewService.deleteReview as jest.Mock).mockResolvedValue({
        success: true,
      });

      await remove(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Review deleted successfully',
      });
    });

    it('should handle non-existent review', async () => {
      (reviewService.deleteReview as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Review not found',
      });

      await remove(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Review not found',
      });
    });

    it('should handle invalid reviewId parameter', async () => {
      mockRequest.params = { reviewId: 'invalid' };

      await remove(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid review ID',
      });
    });

    it('should handle service errors', async () => {
      (reviewService.deleteReview as jest.Mock).mockRejectedValue(
        new Error('Service error')
      );

      await remove(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error deleting review',
        error: expect.any(Error),
      });
    });
  });
});
