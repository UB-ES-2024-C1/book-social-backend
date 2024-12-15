import { AppDataSource } from '../../../config/database';
import { User, UserRole } from '../../../entities/User';
import { Book } from '../../../entities/Book';
import { toggleSavedBook, isBookSaved, getSavedBooks } from '../../../services/book.service';

jest.mock('../../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('Saved Books Service', () => {
  let mockUserRepository: any;
  let mockBookRepository: any;

  const mockUser = {
    id: 1,
    firstName: 'Test',
    lastName: 'User',
    genre: 'Fiction',
    username: 'testuser',
    email: 'test@example.com',
    password: 'Password123!',
    role: UserRole.READER,
    savedBooks: [],
  } as User;

  const mockBook = {
    id: 1,
    title: 'Test Book',
    author: {
      firstName: 'John',
      lastName: 'Doe'
    },
    genres: ['Fiction'],
    synopsis: 'Test synopsis',
    reviewValue: 4.5,
    image_url: 'http://example.com/image.jpg'
  } as Book;

  beforeEach(() => {
    mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    mockBookRepository = {
      findOne: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === User) return mockUserRepository;
      if (entity === Book) return mockBookRepository;
      return {};
    });
  });

  describe('toggleSavedBook', () => {
    it('should add book to saved list when not already saved', async () => {
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser });
      mockBookRepository.findOne.mockResolvedValue(mockBook);
      mockUserRepository.save.mockResolvedValue({ ...mockUser, savedBooks: [mockBook] });

      const result = await toggleSavedBook(1, 1);

      expect(result.isSaved).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should remove book from saved list when already saved', async () => {
      mockUserRepository.findOne.mockResolvedValue({ 
        ...mockUser, 
        savedBooks: [mockBook] 
      });
      mockBookRepository.findOne.mockResolvedValue(mockBook);
      mockUserRepository.save.mockResolvedValue({ ...mockUser, savedBooks: [] });

      const result = await toggleSavedBook(1, 1);

      expect(result.isSaved).toBe(false);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should return error when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await toggleSavedBook(1, 1);

      expect(result.error).toBe('User not found');
      expect(result.isSaved).toBe(false);
    });
  });

  describe('isBookSaved', () => {
    it('should return true when book is saved', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        ...mockUser,
        savedBooks: [mockBook],
      });

      const result = await isBookSaved(1, 1);

      expect(result.isSaved).toBe(true);
    });

    it('should return false when book is not saved', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        ...mockUser,
        savedBooks: [],
      });

      const result = await isBookSaved(1, 1);

      expect(result.isSaved).toBe(false);
    });
  });

  describe('getSavedBooks', () => {
    it('should return list of saved books', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        ...mockUser,
        savedBooks: [mockBook],
      });

      const result = await getSavedBooks(1);

      expect(result.books).toHaveLength(1);
      expect(result.books[0]).toMatchObject({
        id: mockBook.id,
        title: mockBook.title,
        genres: mockBook.genres,
        author: {
          firstName: mockBook.author.firstName,
          lastName: mockBook.author.lastName,
        },
      });
    });

    it('should return empty array when user has no saved books', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        ...mockUser,
        savedBooks: [],
      });

      const result = await getSavedBooks(1);

      expect(result.books).toHaveLength(0);
    });
  });
}); 