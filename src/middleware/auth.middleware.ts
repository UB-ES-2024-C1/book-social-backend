import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { Review } from '../entities/Review';
import { Book } from '../entities/Book';

// Extend Express Request type to include user
import 'express';

declare module 'express' {
  interface Request {
    user?: User;
  }
}

// Verify JWT token and attach user to request
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Authentication token required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: number;
    };

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: decoded.id } });

    if (!user) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
    return;
  }
};

// Check if user is a writer
export const requireWriter = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== UserRole.WRITER) {
    res.status(403).json({ message: 'Writer access required' });
    return;
  }
  next();
};

// Middleware factory para verificar propiedad de recursos
export const requireOwnership = (
  resourceType: 'review' | 'book' | 'user',
  idParam: string
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resourceId = parseInt(req.params[idParam]);
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      if (isNaN(resourceId)) {
        res.status(400).json({ message: 'Invalid resource ID' });
        return;
      }

      let isOwner = false;
      let review;
      let book;

      switch (resourceType) {
        case 'review':
          review = await AppDataSource.getRepository(Review).findOne({
            where: { id: resourceId },
            relations: ['user'],
          });
          isOwner = review?.user.id === userId;
          break;

        case 'book':
          book = await AppDataSource.getRepository(Book).findOne({
            where: { id: resourceId },
            relations: ['author'],
          });
          isOwner = book?.author.id === userId;
          break;

        case 'user':
          isOwner = resourceId === userId;
          break;
      }

      if (!isOwner) {
        res.status(403).json({
          message: 'You do not have permission to perform this action',
        });
        return;
      }

      next();
    } catch {
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};
