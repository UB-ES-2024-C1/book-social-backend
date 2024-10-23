import { Request, Response, NextFunction } from 'express';
import { loginUser, registerUser } from '../services/auth.service';

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    const token = await loginUser(email, password);
    if (!token) {
      res.status(401).json({ message: 'Invalid credentials' });
    }
    res.status(200).json({ token });
  } catch (error) {
    // TODO: Handle error con un middleware en vez de devolver la respuesta 500
    // next(error);
    res.status(500).json({ message: 'Error logging in', error });
  }
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;

    const newUser = await registerUser(
      firstName,
      lastName,
      username,
      email,
      password
    );

    if (!newUser) {
      res.status(400).json({ message: 'Error registering user' });
      return;
    }

    res.status(201).json({
      message: 'User registered successfully',
      userId: newUser?.id,
    });
  } catch (error) {
    // TODO: Handle error with a middleware instead of returning 500 response
    // next(error);
    res.status(500).json({ message: 'Error registering user', error });
  }
};
