import { Request, Response, NextFunction } from 'express';
import { loginUser, registerUser } from '../services/auth.service';
import { validateLoginInput, validateRegisterInput } from '../utils/validation';

/**
 * Handles user login.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The Express next function.
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    const validation = validateLoginInput(email, password);

    if (!validation.isValid) {
      res.status(400).json({
        message: 'Validation failed',
        errors: validation.errors,
      });
      return;
    }

    const token = await loginUser(email, password);
    if (!token) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
};

/**
 * Handles user registration.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The Express next function.
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { firstName, lastName, username, email, password, role } = req.body;

    const validation = validateRegisterInput(
      firstName,
      lastName,
      username,
      email,
      password
    );

    if (!validation.isValid) {
      res.status(400).json({
        message: 'Validation failed',
        errors: validation.errors,
      });
      return;
    }

    const result = await registerUser(
      firstName,
      lastName,
      username,
      email,
      password,
      role
    );

    if (!result.user) {
      res.status(400).json({ message: result.error });
      return;
    }

    res.status(201).json({
      message: 'User registered successfully',
      userId: result.user.id,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
};
