// Deshabilitar el mock de class-validator para este archivo
// ya que necesitamos las validaciones reales para probar la entidad
jest.unmock('class-validator');

import 'reflect-metadata';
import { Review } from '../../../entities/Review';
import { User } from '../../../entities/User';
import { Book } from '../../../entities/Book';
import { UserRole } from '../../../entities/User';
import { validate } from 'class-validator';

describe('Review Entity', () => {
  // Mock data setup
  let mockUser: User;
  let mockBook: Book;
  let validReviewData: {
    user: User;
    book: Book;
    rating: number;
    comment?: string;
  };

  beforeEach(() => {
    // Create mock user
    mockUser = new User();
    Object.assign(mockUser, {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      username: 'johndoe',
      password: 'Password123!',
      role: UserRole.WRITER,
    });

    // Create mock book
    mockBook = new Book();
    Object.assign(mockBook, {
      id: 1,
      title: 'Test Book',
      author: mockUser,
      publication_date: new Date(),
      genres: ['Fiction'],
    });

    // Setup valid review data
    validReviewData = {
      user: mockUser,
      book: mockBook,
      rating: 4.5,
      comment: 'This is a test comment',
    };
  });

  describe('Validation', () => {
    it('should validate a review with all required fields', async () => {
      const review = new Review();
      Object.assign(review, validReviewData);

      // Asignar created_at manualmente ya que no estamos usando la base de datos
      review.created_at = new Date();

      const errors = await validate(review);

      // Si hay errores, mostrarlos para debugging
      if (errors.length > 0) {
        console.log('Validation errors:', errors);
      }

      expect(errors.length).toBe(0);
    });

    it('should fail validation when user is missing', async () => {
      const review = new Review();
      const reviewWithoutUser = { ...validReviewData, user: null };
      Object.assign(review, reviewWithoutUser);
      review.created_at = new Date();

      const errors = await validate(review);

      const userErrors = errors.filter(
        (error) => error.property === 'user' && error.constraints?.isNotEmpty
      );

      expect(userErrors.length).toBeGreaterThan(0);
      expect(userErrors[0].constraints?.isNotEmpty).toContain(
        'User is required'
      );
    });

    it('should fail validation when book is missing', async () => {
      const review = new Review();
      const reviewWithoutBook = { ...validReviewData, book: null };
      Object.assign(review, reviewWithoutBook);
      review.created_at = new Date();

      const errors = await validate(review);

      const bookErrors = errors.filter(
        (error) => error.property === 'book' && error.constraints?.isNotEmpty
      );

      expect(bookErrors.length).toBeGreaterThan(0);
      expect(bookErrors[0].constraints?.isNotEmpty).toContain(
        'Book is required'
      );
    });

    it('should fail validation when rating is missing', async () => {
      const review = new Review();
      const reviewWithoutRating = { ...validReviewData, rating: null };
      Object.assign(review, reviewWithoutRating);
      review.created_at = new Date();

      const errors = await validate(review);

      const ratingErrors = errors.filter(
        (error) => error.property === 'rating' && error.constraints?.isNotEmpty
      );

      expect(ratingErrors.length).toBeGreaterThan(0);
      expect(ratingErrors[0].constraints?.isNotEmpty).toContain(
        'Rating is required'
      );
    });

    it('should fail validation when rating is less than 0', async () => {
      const review = new Review();
      Object.assign(review, { ...validReviewData, rating: -1 });
      review.created_at = new Date();

      const errors = await validate(review);

      const ratingErrors = errors.filter(
        (error) => error.property === 'rating' && error.constraints?.min
      );

      expect(ratingErrors.length).toBeGreaterThan(0);
      expect(ratingErrors[0].constraints?.min).toContain(
        'Rating must be at least 0'
      );
    });

    it('should fail validation when rating is greater than 5', async () => {
      const review = new Review();
      Object.assign(review, { ...validReviewData, rating: 5.1 });
      review.created_at = new Date();

      const errors = await validate(review);

      const ratingErrors = errors.filter(
        (error) => error.property === 'rating' && error.constraints?.max
      );

      expect(ratingErrors.length).toBeGreaterThan(0);
      expect(ratingErrors[0].constraints?.max).toContain(
        'Rating must be at most 5'
      );
    });

    it('should fail validation when rating is not a number', async () => {
      const review = new Review();
      Object.assign(review, {
        ...validReviewData,
        rating: 'not a number' as unknown as number,
      });
      review.created_at = new Date();

      const errors = await validate(review);

      const ratingErrors = errors.filter(
        (error) => error.property === 'rating' && error.constraints?.isNumber
      );

      expect(ratingErrors.length).toBeGreaterThan(0);
      expect(ratingErrors[0].constraints?.isNumber).toContain(
        'Rating must be a number'
      );
    });

    it('should validate a review with optional comment', async () => {
      const review = new Review();
      Object.assign(review, validReviewData);
      review.created_at = new Date();

      const errors = await validate(review);
      expect(errors.length).toBe(0);
    });

    it('should validate a review without comment', async () => {
      const review = new Review();
      const { comment, ...reviewWithoutComment } = validReviewData;
      Object.assign(review, reviewWithoutComment);
      review.created_at = new Date();

      const errors = await validate(review);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when comment is too long', async () => {
      const review = new Review();
      const longComment = 'a'.repeat(1001);
      Object.assign(review, { ...validReviewData, comment: longComment });
      review.created_at = new Date();

      const errors = await validate(review);
      const commentErrors = errors.filter(
        (error) => error.property === 'comment'
      );

      expect(commentErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Created Date', () => {
    it('should validate with a valid created_at date', async () => {
      const review = new Review();
      Object.assign(review, {
        ...validReviewData,
        created_at: new Date(),
      });

      const errors = await validate(review);
      expect(
        errors.filter((error) => error.property === 'created_at').length
      ).toBe(0);
    });

    it('should fail validation if created_at is set to invalid date', async () => {
      const review = new Review();
      Object.assign(review, {
        ...validReviewData,
        created_at: 'invalid date' as unknown as Date,
      });

      const errors = await validate(review);

      const dateErrors = errors.filter(
        (error) => error.property === 'created_at' && error.constraints?.isDate
      );

      expect(dateErrors.length).toBeGreaterThan(0);
      expect(dateErrors[0].constraints?.isDate).toContain(
        'Created date must be a valid date'
      );
    });
  });

  describe('Entity Relations', () => {
    it('should properly establish relation with User', () => {
      const review = new Review();
      Object.assign(review, validReviewData);
      review.created_at = new Date();

      expect(review.user).toBeDefined();
      expect(review.user.id).toBe(mockUser.id);
      expect(review.user.username).toBe(mockUser.username);
    });

    it('should properly establish relation with Book', () => {
      const review = new Review();
      Object.assign(review, validReviewData);
      review.created_at = new Date();

      expect(review.book).toBeDefined();
      expect(review.book.id).toBe(mockBook.id);
      expect(review.book.title).toBe(mockBook.title);
    });
  });
});
