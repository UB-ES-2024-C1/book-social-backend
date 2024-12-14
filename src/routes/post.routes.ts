import { Router } from 'express';
import {
  createPost,
  getAllPosts,
  getPostsByUserId,
} from '../controllers/post.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/create', authenticateToken, createPost);
router.get('/', authenticateToken, getAllPosts);
router.get('/user/:userId', authenticateToken, getPostsByUserId);

export default router;
