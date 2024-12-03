import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../../../entities/User';
import { Review } from '../../../entities/Review';
import { Book } from '../../../entities/Book';
import {
  authenticateToken,
  requireWriter,
  requireOwnership,
} from '../../../middleware/auth.middleware';

// Mock repositories
const mockUserRepository = {
  findOne: jest.fn(),
};

const mockReviewRepository = {
  findOne: jest.fn(),
};

const mockBookRepository = {
  findOne: jest.fn(),
};

// Mock AppDataSource
jest.mock('../../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity) => {
      if (entity === User) return mockUserRepository;
      if (entity === Review) return mockReviewRepository;
      if (entity === Book) return mockBookRepository;
      return {};
    }),
  },
}));

// Mock jwt
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {
      headers: {},
      params: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      role: UserRole.READER,
    } as User;

    it('should authenticate valid token', async () => {
      const token = 'valid.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toEqual(mockUser);
    });

    it('should return 401 when no token provided', async () => {
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Authentication token required',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid.token',
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid token',
      });
    });
  });

  describe('requireWriter', () => {
    it('should allow writer access', () => {
      mockRequest.user = {
        id: 1,
        role: UserRole.WRITER,
      } as User;

      requireWriter(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should deny non-writer access', () => {
      mockRequest.user = {
        id: 1,
        role: UserRole.READER,
      } as User;

      requireWriter(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Writer access required',
      });
    });
  });

  describe('requireOwnership', () => {
    const mockUser = {
      id: 1,
      role: UserRole.READER,
    } as User;

    beforeEach(() => {
      mockRequest.user = mockUser;
    });

    describe('Review ownership', () => {
      it('should allow access to review owner', async () => {
        mockRequest.params = { reviewId: '1' };
        mockReviewRepository.findOne.mockResolvedValue({
          id: 1,
          user: { id: mockUser.id },
        });

        const middleware = requireOwnership('review', 'reviewId');
        await middleware(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        expect(nextFunction).toHaveBeenCalled();
      });

      it('should deny access to non-owner', async () => {
        mockRequest.params = { reviewId: '1' };
        mockReviewRepository.findOne.mockResolvedValue({
          id: 1,
          user: { id: 999 },
        });

        const middleware = requireOwnership('review', 'reviewId');
        await middleware(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: 'You do not have permission to perform this action',
        });
      });
    });

    describe('Book ownership', () => {
      it('should allow access to book author', async () => {
        mockRequest.params = { bookId: '1' };
        mockBookRepository.findOne.mockResolvedValue({
          id: 1,
          author: { id: mockUser.id },
        });

        const middleware = requireOwnership('book', 'bookId');
        await middleware(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        expect(nextFunction).toHaveBeenCalled();
      });
    });

    describe('User ownership', () => {
      it('should allow access to own user profile', async () => {
        mockRequest.params = { userId: '1' };

        const middleware = requireOwnership('user', 'userId');
        await middleware(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        expect(nextFunction).toHaveBeenCalled();
      });
    });

    it('should handle invalid resource ID', async () => {
      mockRequest.params = { reviewId: 'invalid' };

      const middleware = requireOwnership('review', 'reviewId');
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid resource ID',
      });
    });

    it('should handle database errors', async () => {
      mockRequest.params = { reviewId: '1' };
      mockReviewRepository.findOne.mockRejectedValue(new Error('DB Error'));

      const middleware = requireOwnership('review', 'reviewId');
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Internal server error',
      });
    });
  });
});
