import { validateBookInput } from '../../../utils/bookValidation';
import { Book } from '../../../entities/Book';
import { User } from '../../../entities/User';
import { UserRole } from '../../../entities/User';

describe('Book Validation', () => {
  // Mock de User para tests
  const mockUser: User = {
    id: 1,
    firstName: 'Test',
    lastName: 'Author',
    email: 'test@example.com',
    username: 'testauthor',
    password: 'Password123!',
    role: UserRole.WRITER,
    books: [],
  } as User;

  // Valid book data para reutilizar
  const validBookData: Partial<Book> = {
    title: 'Test Book',
    author: mockUser,
    publication_date: new Date('2024-03-20'),
    genres: ['Fiction'],
    num_pages: 200,
    publisher: 'Test Publisher',
    image_url: 'https://example.com/image.jpg',
    reviewValue: 4.5,
  };

  describe('Required Fields Validation', () => {
    it('should validate a book with all required fields', () => {
      const result = validateBookInput(validBookData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when title is missing', () => {
      const bookWithoutTitle = { ...validBookData };
      delete bookWithoutTitle.title;
      const result = validateBookInput(bookWithoutTitle);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required');
    });

    it('should fail when genres is missing', () => {
      const bookWithoutGenres = { ...validBookData };
      delete bookWithoutGenres.genres;
      const result = validateBookInput(bookWithoutGenres);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Genre is required');
    });

    it('should fail when publication_date is missing', () => {
      const bookWithoutDate = { ...validBookData };
      delete bookWithoutDate.publication_date;
      const result = validateBookInput(bookWithoutDate);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Publication date is required');
    });

    it('should fail when author is missing', () => {
      const bookWithoutAuthor = { ...validBookData };
      delete bookWithoutAuthor.author;
      const result = validateBookInput(bookWithoutAuthor);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Author is required');
    });
  });

  describe('Length Validations', () => {
    it('should fail when title exceeds 255 characters', () => {
      const longTitle = 'a'.repeat(256);
      const result = validateBookInput({
        ...validBookData,
        title: longTitle,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Title must be between 1 and 255 characters'
      );
    });

    it('should fail when title is empty string', () => {
      const result = validateBookInput({
        ...validBookData,
        title: '',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required');
    });
  });

  describe('URL Validation', () => {
    it('should validate correct image URL', () => {
      const result = validateBookInput({
        ...validBookData,
        image_url: 'https://example.com/image.jpg',
      });

      expect(result.isValid).toBe(true);
    });

    it('should fail with invalid image URL', () => {
      const result = validateBookInput({
        ...validBookData,
        image_url: 'not-a-url',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Image URL must be a valid URL');
    });

    it('should accept undefined image URL', () => {
      const bookWithoutImage = { ...validBookData };
      delete bookWithoutImage.image_url;
      const result = validateBookInput(bookWithoutImage);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Number Validations', () => {
    it('should validate correct number of pages', () => {
      const result = validateBookInput({
        ...validBookData,
        num_pages: 100,
      });

      expect(result.isValid).toBe(true);
    });

    it('should fail with negative number of pages', () => {
      const result = validateBookInput({
        ...validBookData,
        num_pages: -1,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Number of pages must be at least 1');
    });

    it('should validate correct review value', () => {
      const result = validateBookInput({
        ...validBookData,
        reviewValue: 4.5,
      });

      expect(result.isValid).toBe(true);
    });

    it('should fail with review value greater than 5', () => {
      const result = validateBookInput({
        ...validBookData,
        reviewValue: 6,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Review value must be between 0 and 5');
    });

    it('should fail with negative review value', () => {
      const result = validateBookInput({
        ...validBookData,
        reviewValue: -1,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Review value must be between 0 and 5');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing input', () => {
      // @ts-expect-error - Probando caso inválido intencionalmente
      const result = validateBookInput(undefined);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Book data is required');
    });

    it('should handle null input', () => {
      // @ts-expect-error - Probando caso inválido intencionalmente
      const result = validateBookInput(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Book data is required');
    });

    it('should handle empty object', () => {
      const result = validateBookInput({});

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required');
      expect(result.errors).toContain('Genre is required');
      expect(result.errors).toContain('Publication date is required');
      expect(result.errors).toContain('Author is required');
    });

    it('should handle invalid date format', () => {
      const result = validateBookInput({
        ...validBookData,
        publication_date: new Date('invalid-date'),
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Publication date must be a valid date');
    });
  });

  describe('Optional Fields', () => {
    it('should validate book with only required fields', () => {
      const minimalBook: Partial<Book> = {
        title: 'Test Book',
        author: mockUser,
        publication_date: new Date('2024-03-20'),
        genres: ['Fiction'],
      };

      const result = validateBookInput(minimalBook);
      expect(result.isValid).toBe(true);
    });

    it('should accept valid publisher', () => {
      const result = validateBookInput({
        ...validBookData,
        publisher: 'Test Publisher',
      });

      expect(result.isValid).toBe(true);
    });

    it('should accept undefined optional fields', () => {
      const requiredFields = {
        title: validBookData.title,
        author: validBookData.author,
        publication_date: validBookData.publication_date,
        genres: validBookData.genres,
      };

      const result = validateBookInput(requiredFields);
      expect(result.isValid).toBe(true);
    });
  });
});
