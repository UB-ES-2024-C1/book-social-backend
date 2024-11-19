import { Request, Response } from 'express';
import { create } from '../../../controllers/book.controller';
import * as bookService from '../../../services/book.service';
import * as bookValidation from '../../../utils/bookValidation';

// Mock de las dependencias
jest.mock('../../../services/book.service');
jest.mock('../../../utils/bookValidation');

describe('Book Controller', () => {
  // Setup inicial para cada test
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {
        title: 'Test Book',
        author: 1,
        publication_date: '2024-03-20',
        genre: 'Fiction',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();

    // Limpiar todos los mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('successful creation', () => {
      beforeEach(() => {
        // Mock de validación exitosa
        (bookValidation.validateBookInput as jest.Mock).mockReturnValue({
          isValid: true,
          errors: [],
        });

        // Mock de creación exitosa
        (bookService.createBook as jest.Mock).mockResolvedValue({
          book: {
            id: 1,
            title: 'Test Book',
            author: { id: 1, name: 'Test Author' },
            publication_date: '2024-03-20',
            genre: 'Fiction',
          },
        });
      });

      it('should create a book and return 201 status', async () => {
        await create(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: 'Book created successfully',
          book: expect.objectContaining({
            id: 1,
            title: 'Test Book',
          }),
        });
      });

      it('should call the validation service with correct data', async () => {
        await create(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(bookValidation.validateBookInput).toHaveBeenCalledWith(
          mockRequest.body
        );
      });
    });

    describe('validation failures', () => {
      beforeEach(() => {
        (bookValidation.validateBookInput as jest.Mock).mockReturnValue({
          isValid: false,
          errors: ['Title is required'],
        });
      });

      it('should return 400 status with validation errors', async () => {
        await create(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: 'Validation failed',
          errors: ['Title is required'],
        });
      });

      it('should not call createBook service if validation fails', async () => {
        await create(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(bookService.createBook).not.toHaveBeenCalled();
      });
    });

    describe('service failures', () => {
      beforeEach(() => {
        (bookValidation.validateBookInput as jest.Mock).mockReturnValue({
          isValid: true,
          errors: [],
        });

        (bookService.createBook as jest.Mock).mockResolvedValue({
          book: null,
          error: 'Author not found',
        });
      });

      it('should return 400 status when service fails with error message', async () => {
        await create(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: 'Author not found',
        });
      });
    });

    describe('unexpected errors', () => {
      beforeEach(() => {
        (bookValidation.validateBookInput as jest.Mock).mockReturnValue({
          isValid: true,
          errors: [],
        });

        (bookService.createBook as jest.Mock).mockRejectedValue(
          new Error('Database error')
        );
      });

      it('should return 500 status on unexpected errors', async () => {
        await create(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: 'Error creating book',
          error: expect.any(Error),
        });
      });

      it('should handle service throwing an error', async () => {
        const mockError = new Error('Unexpected service error');
        (bookService.createBook as jest.Mock).mockRejectedValue(mockError);

        await create(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: 'Error creating book',
          error: mockError
        });
      });
    });

    describe('edge cases', () => {
      it('should handle empty request body', async () => {
        mockRequest.body = {};

        (bookValidation.validateBookInput as jest.Mock).mockReturnValue({
          isValid: false,
          errors: ['Required fields missing'],
        });

        await create(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: 'Validation failed',
          errors: ['Required fields missing'],
        });
      });

      it('should handle null request body', async () => {
        mockRequest.body = null;

        await create(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: 'Validation failed',
          errors: expect.any(Array),
        });
      });
    });
  });
});
