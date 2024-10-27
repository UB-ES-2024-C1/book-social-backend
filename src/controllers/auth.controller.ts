import { Request, Response, NextFunction } from 'express';
import { loginUser, registerUser } from '../services/auth.service';
import { validateUserEmail, validateUserPassword } from '../utils/validation';

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    const emailError = validateUserEmail(email);
    const passwordError = validateUserPassword(password);

    if (emailError || passwordError) {
      res.status(400).json({ message: emailError || passwordError });
      return;
    }

    const token = await loginUser(email, password);
    if (!token) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
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

    if (!firstName || !lastName || !username || !email || !password) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const result = await registerUser(
      firstName,
      lastName,
      username,
      email,
      password
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
