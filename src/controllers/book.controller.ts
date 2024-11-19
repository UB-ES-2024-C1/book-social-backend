import { Request, Response, NextFunction } from 'express';
import { createBook } from '../services/book.service';
import { validateBookInput } from '../utils/bookValidation';

/**
 * Handles book creation.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The Express next function.
 */
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = validateBookInput(req.body);

    if (!validation.isValid) {
      res.status(400).json({
        message: 'Validation failed',
        errors: validation.errors,
      });
      return;
    }

    const result = await createBook(req.body);

    if (!result.book) {
      res.status(400).json({ message: result.error });
      return;
    }

    res.status(201).json({
      message: 'Book created successfully',
      book: result.book,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating book', error });
  }
};
