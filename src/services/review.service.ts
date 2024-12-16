import { AppDataSource } from '../config/database';
import { Review } from '../entities/Review';
import { User } from '../entities/User';
import { Book } from '../entities/Book';
import { validate } from 'class-validator';

// Initialize repositories for Review, User, and Book
const reviewRepository = AppDataSource.getRepository(Review);
const userRepository = AppDataSource.getRepository(User);
const bookRepository = AppDataSource.getRepository(Book);

/**
 * Creates a new review and saves it to the database.
 *
 * @param reviewData - The data for the review to be created.
 * @returns A Promise that resolves to an object containing the created review or an error message.
 */
export const createReview = async (reviewData: {
  userId: number;
  bookId: number;
  rating: number;
  comment?: string;
}): Promise<{ review: Review | null; error?: string }> => {
  try {
    const user = await userRepository.findOne({
      where: { id: reviewData.userId },
    });
    const book = await bookRepository.findOne({
      where: { id: reviewData.bookId },
    });

    if (!user || !book) {
      return { review: null, error: 'User or Book not found' };
    }

    const review = new Review();
    review.user = user;
    review.book = book;
    review.rating = reviewData.rating;
    review.comment = reviewData.comment;

    const errors = await validate(review);
    if (errors.length > 0) {
      const validationErrors = errors
        .map((error) => Object.values(error.constraints || {}))
        .flat();
      return { review: null, error: validationErrors.join(', ') };
    }

    const savedReview = await reviewRepository.save(review);
    return { review: savedReview };
  } catch (_error) {
    return { review: null, error: 'Error creating review' };
  }
};

/**
 * Fetches reviews for a given book.
 *
 * @param bookId - The ID of the book for which to fetch reviews.
 * @returns A Promise that resolves to an object containing the reviews or an error message.
 */
export const getReviewsByBook = async (
  bookId: number
): Promise<{ reviews: Review[] | null; error?: string }> => {
  try {
    // Find reviews for the given book
    const reviews = await reviewRepository.find({
      where: { book: { id: bookId } },
      relations: ['user', 'book'],
    });
    return { reviews };
  } catch {
    return { reviews: null, error: 'Error fetching reviews' };
  }
};

/**
 * Fetches reviews for a given user.
 *
 * @param userId - The ID of the user for which to fetch reviews.
 * @returns A Promise that resolves to an object containing the reviews or an error message.
 */
export const getReviewsByUser = async (
  userId: number
): Promise<{ reviews: Review[] | null; error?: string }> => {
  try {
    // Find reviews for the given user
    const reviews = await reviewRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'book'],
    });
    return { reviews };
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return { reviews: null, error: 'Error fetching reviews' };
  }
};

/**
 * Deletes a review by its ID.
 *
 * @param reviewId - The ID of the review to be deleted.
 * @returns A Promise that resolves to an object indicating the success of the operation or an error message.
 */
export const deleteReview = async (
  reviewId: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Delete the review from the database
    const result = await reviewRepository.delete(reviewId);
    return { success: result.affected ? result.affected > 0 : false };
  } catch (error) {
    console.error('Error deleting review:', error);
    return { success: false, error: 'Error deleting review' };
  }
};
