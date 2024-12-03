import { getBookInfo } from '../../../controllers/book.controller';
import { getBook } from '../../../services/book.service';
import { Request, Response } from 'express';
import { create } from '../../../controllers/book.controller';
import * as bookService from '../../../services/book.service';
import * as bookValidation from '../../../utils/bookValidation';

jest.mock('../../../services/book.service', () => ({
  createBook: jest.fn(),
  getBook: jest.fn(),
}));

jest.mock('../../../utils/bookValidation', () => ({
  validateBookInput: jest.fn(),
}));

describe('Book Controller - getBookInfo', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      params: {
        id: '1', // mock the ID of the book to be fetched
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should return 404 if the book is not found', async () => {
    (getBook as jest.Mock).mockResolvedValue(null); // Simulate no book found

    await getBookInfo(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Book not found' });
  });

  it('should return 200 and book data if the book is found', async () => {
    const mockBook = {
      id: 1,
      title: 'Mock Book Title',
      author: { firstName: 'John', lastName: 'Doe' },
      publication_date: new Date('2020-01-01'),
      genres: ['Fiction'],
      ISBN: '9780156031448',
      image_url: 'http://example.com/image.jpg',
      synopsis: 'This is a mock book synopsis.',
    };

    (getBook as jest.Mock).mockResolvedValue(mockBook); // Simulate book found

    await getBookInfo(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ISBN: mockBook.ISBN,
      language: 'English',
      published: mockBook.publication_date.toDateString(),
      edition: 'First edition',
      title: mockBook.title,
      image: mockBook.image_url,
      synopsis: mockBook.synopsis,
      genres: mockBook.genres,
      author: `${mockBook.author.lastName}, ${mockBook.author.firstName}`,
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
    });
  });

  it('should call next with error on exception', async () => {
    const mockError = new Error('Test error');
    (getBook as jest.Mock).mockRejectedValue(mockError); // Simulate error in fetching book

    await getBookInfo(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'An error occurred while fetching book info. Error: Test error',
    });
  });
});

// Mock de las dependencias
jest.mock('../../../services/book.service');
jest.mock('../../../utils/bookValidation');

describe('Book Controller', () => {
  // Setup inicial para cada test
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      body: {
        title: 'Test Book',
        author: 1,
        publication_date: '2024-03-20',
        genres: ['Fiction'],
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

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
            genres: ['Fiction'],
          },
        });
      });

      it('should create a book and return 201 status', async () => {
        await create(mockRequest as Request, mockResponse as Response);

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
        await create(mockRequest as Request, mockResponse as Response);

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
        await create(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: 'Validation failed',
          errors: ['Title is required'],
        });
      });

      it('should not call createBook service if validation fails', async () => {
        await create(mockRequest as Request, mockResponse as Response);

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
        await create(mockRequest as Request, mockResponse as Response);

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
        await create(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: 'Error creating book',
          error: expect.any(Error),
        });
      });

      it('should handle service throwing an error', async () => {
        const mockError = new Error('Unexpected service error');
        (bookService.createBook as jest.Mock).mockRejectedValue(mockError);

        await create(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: 'Error creating book',
          error: mockError,
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

        await create(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: 'Validation failed',
          errors: ['Required fields missing'],
        });
      });

      it('should handle null request body', async () => {
        mockRequest.body = null;

        await create(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: 'Validation failed',
          errors: expect.any(Array),
        });
      });
    });
  });
});
