import { AppDataSource } from '../../../config/database';
import { Book } from '../../../entities/Book';
import { User } from '../../../entities/User';
import { UserRole } from '../../../entities/User';
import { createBook, getBooksList } from '../../../services/book.service';
import { validate } from 'class-validator';

// Mock de las dependencias
jest.mock('../../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('class-validator', () => ({
  validate: jest.fn(),
}));

describe('Book Service', () => {
  let bookRepositoryMock: any;
  let userRepositoryMock: any;
  let mockUser: User;
  let mockBook: Partial<Book>;

  beforeEach(() => {
    // Reset de mocks
    jest.clearAllMocks();

    // Mock del usuario
    mockUser = {
      id: 1,
      firstName: 'Test',
      lastName: 'Author',
      email: 'test@example.com',
      username: 'testauthor',
      role: UserRole.WRITER,
    } as User;

    // Mock del libro
    mockBook = {
      title: 'Test Book',
      author: mockUser,
      publication_date: new Date('2024-03-20'),
      genres: ['Fiction'],
      synopsis: 'Test synopsis',
      image_url: 'https://example.com/image.jpg',
      num_pages: 200,
      publisher: 'Test Publisher',
      reviewValue: 4.5,
    };

    // Setup de los repositorios mock
    bookRepositoryMock = {
      save: jest.fn(),
      create: jest.fn(),
    };

    userRepositoryMock = {
      findOne: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock)
      .mockReturnValueOnce(bookRepositoryMock)
      .mockReturnValueOnce(userRepositoryMock);

    // Mock de validate para pasar por defecto
    (validate as jest.Mock).mockResolvedValue([]);
  });

  describe('createBook', () => {
    it('should successfully create a book with valid data', async () => {
      userRepositoryMock.findOne.mockResolvedValue(mockUser);
      bookRepositoryMock.save.mockResolvedValue({ id: 1, ...mockBook });

      const result = await createBook(mockBook);

      expect(result.book).toBeDefined();
      expect(result.book).toHaveProperty('id', 1);
      expect(result.error).toBeUndefined();
      expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should return error when author is not found', async () => {
      userRepositoryMock.findOne.mockResolvedValue(null);

      const result = await createBook(mockBook);

      expect(result.book).toBeNull();
      expect(result.error).toBe('Author not found');
      expect(bookRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      userRepositoryMock.findOne.mockResolvedValue(mockUser);
      (validate as jest.Mock).mockResolvedValue([
        {
          constraints: {
            length: 'Title must be between 1 and 255 characters',
          },
        },
      ]);

      const result = await createBook(mockBook);

      expect(result.book).toBeNull();
      expect(result.error).toBe('Title must be between 1 and 255 characters');
      expect(bookRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      userRepositoryMock.findOne.mockResolvedValue(mockUser);
      bookRepositoryMock.save.mockRejectedValue(new Error('Database error'));

      const result = await createBook(mockBook);

      expect(result.book).toBeNull();
      expect(result.error).toBe('Error saving book to database');
    });

    it('should handle multiple validation errors', async () => {
      userRepositoryMock.findOne.mockResolvedValue(mockUser);
      (validate as jest.Mock).mockResolvedValue([
        {
          constraints: {
            length: 'Title must be between 1 and 255 characters',
            isNotEmpty: 'Title is required',
          },
        },
      ]);

      const result = await createBook(mockBook);

      expect(result.book).toBeNull();
      expect(result.error).toBe(
        'Title must be between 1 and 255 characters, Title is required'
      );
    });

    it('should handle author id provided as number', async () => {
      userRepositoryMock.findOne.mockResolvedValue(mockUser);
      bookRepositoryMock.save.mockResolvedValue({ id: 1, ...mockBook });

      // Creamos un objeto que omite el autor
      const { author, ...bookWithoutAuthor } = mockBook;

      // Creamos un nuevo objeto con el ID del autor
      const bookInput = {
        ...bookWithoutAuthor,
        // Usamos unknown como tipo intermedio para evitar el error de tipado
        author: mockUser.id as unknown as User,
      };

      const result = await createBook(bookInput);

      expect(result.book).toBeDefined();
      expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    describe('Edge Cases', () => {
      it('should handle undefined author', async () => {
        const { author, ...bookWithoutAuthor } = mockBook;
        const result = await createBook(bookWithoutAuthor);

        expect(result.book).toBeNull();
        expect(result.error).toBeDefined();
      });

      it('should handle invalid author id format', async () => {
        const { author, ...bookWithoutAuthor } = mockBook;

        // Usamos unknown como tipo intermedio
        const invalidBookData = {
          ...bookWithoutAuthor,
          author: 'invalid-id' as unknown as User,
        };

        const result = await createBook(invalidBookData);

        expect(result.book).toBeNull();
        expect(result.error).toBeDefined();
      });

      it('should handle optional fields being undefined', async () => {
        userRepositoryMock.findOne.mockResolvedValue(mockUser);

        // Solo incluimos los campos requeridos
        const minimalBookData: Partial<Book> = {
          title: 'Test Book',
          author: mockUser,
          publication_date: new Date('2024-03-20'),
          genres: ['Fiction'],
        };

        const result = await createBook(minimalBookData);

        expect(result.book).toBeDefined();
        expect(bookRepositoryMock.save).toHaveBeenCalled();
      });
    });
  });
});

jest.mock('../../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('getBooksList', () => {
  let mockBookRepository: jest.Mock;

  beforeEach(() => {
    mockBookRepository = jest.fn();
    AppDataSource.getRepository = mockBookRepository;
  });

  it('should return a filtered list of books by genre and order by date', async () => {
    // Mock the repository behavior
    mockBookRepository.mockReturnValue({
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            title: 'Test Book',
            synopsis: 'A great book.',
            reviewValue: 4.5,
            image_url: 'http://example.com/image.jpg',
            genres: ['Fiction'],
            publication_date: new Date('2022-01-01'),
            authorName: 'John Doe',
          },
        ]),
      }),
    });

    // Call the service with filters
    const result = await getBooksList({
      genres: ['Fiction'],
      orderByDate: true,
    });

    expect(result).toEqual([
      {
        id: 1,
        title: 'Test Book',
        synopsis: 'A great book.',
        reviewValue: 4.5,
        image_url: 'http://example.com/image.jpg',
        genres: ['Fiction'],
        publication_date: new Date('2022-01-01'),
        authorName: 'John Doe',
      },
    ]);
  });

  it('should return all books when no filters are applied', async () => {
    mockBookRepository.mockReturnValue({
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            title: 'Test Book',
            synopsis: 'A great book.',
            reviewValue: 4.5,
            image_url: 'http://example.com/image.jpg',
            genres: ['Fiction'],
            publication_date: new Date('2022-01-01'),
            authorName: 'John Doe',
          },
        ]),
      }),
    });

    const result = await getBooksList();
    expect(result).toEqual([
      {
        id: 1,
        title: 'Test Book',
        synopsis: 'A great book.',
        reviewValue: 4.5,
        image_url: 'http://example.com/image.jpg',
        genres: ['Fiction'],
        publication_date: new Date('2022-01-01'),
        authorName: 'John Doe',
      },
    ]);
  });

  it('should throw an error if the query fails', async () => {
    mockBookRepository.mockReturnValue({
      createQueryBuilder: jest.fn().mockReturnValue({
        getMany: jest.fn().mockRejectedValue(new Error('Query failed')),
      }),
    });

    await expect(getBooksList()).rejects.toThrow('Unable to fetch books list.');
  });
});
