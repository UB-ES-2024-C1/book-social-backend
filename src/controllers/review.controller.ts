import { Request, Response } from 'express';
import {
  createReview,
  getReviewsByBook,
  getReviewsByUser,
  deleteReview,
} from '../services/review.service';

/**
 * Handles the creation of a new review.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const create = async (req: Request, res: Response) => {
  try {
    const result = await createReview(req.body);

    if (!result.review) {
      res.status(400).json({ message: result.error });
      return;
    }

    res.status(201).json({
      message: 'Review created successfully',
      review: result.review,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating review', error });
  }
};

/**
 * Fetches reviews for a given book.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const getByBook = async (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.bookId);

    if (isNaN(bookId)) {
      res.status(400).json({ message: 'Invalid book ID' });
      return;
    }

    const result = await getReviewsByBook(bookId);

    if (!result.reviews) {
      res.status(400).json({ message: result.error });
      return;
    }

    res.status(200).json({ reviews: result.reviews });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error });
  }
};

/**
 * Fetches reviews for a given user.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const getByUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    const result = await getReviewsByUser(userId);

    if (!result.reviews) {
      res.status(400).json({ message: result.error });
      return;
    }

    res.status(200).json({ reviews: result.reviews });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error });
  }
};

/**
 * Deletes a review by its ID.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const remove = async (req: Request, res: Response) => {
  try {
    const reviewId = parseInt(req.params.reviewId);

    if (isNaN(reviewId)) {
      res.status(400).json({ message: 'Invalid review ID' });
      return;
    }

    const result = await deleteReview(reviewId);

    if (!result.success) {
      res.status(400).json({ message: result.error || 'Review not found' });
      return;
    }

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting review', error });
  }
};
