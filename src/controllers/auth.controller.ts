import { Request, Response, NextFunction } from 'express';
import { loginUser } from '../services/auth.service';

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
