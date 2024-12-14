import { Request, Response } from 'express';
import { loginUser, registerUser } from '../services/auth.service';
import { validateLoginInput, validateRegisterInput } from '../utils/validation';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

/**
 * Handles user login.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const login = async (req: Request, res: Response) => {
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
 */
export const register = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      password,
      genre,
      description,
      role,
    } = req.body;

    const validation = validateRegisterInput(
      firstName,
      lastName,
      username,
      email,
      password,
      genre,
      description,
      role
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
      genre,
      description,
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

/**
 * Returns the authenticated user's information
 *
 * @param req - The Express request object
 * @param res - The Express response object
 */
export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    let userData;
    try {
      const {
        firstName: name,
        lastName: lastname,
        email,
        description,
        id,
        username,
        role,
        genre: favGenre,
      } = req.user;

      userData = {
        name,
        email,
        description: description || '',
        id: id.toString(),
        lastname,
        username,
        role: role.toLowerCase(),
        favGenre,
        image: '',
        coverImage: '',
        posts: [],
      };
    } catch {
      throw new Error('Error processing user data');
    }

    res.status(200).json(userData);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching user data',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const userId = req.user.id; // Assuming user ID is passed as a route parameter
    const updates = req.body; // The fields to update are sent in the request body

    // Get the user repository
    const userRepository = AppDataSource.getRepository(User);

    // Find the user by ID
    const user = await userRepository.findOneBy({ id: userId });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Merge updates with the existing user object
    userRepository.merge(user, updates);

    // Validate and save the updated user
    const updatedUser = await userRepository.save(user);

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred', error });
  }
};
