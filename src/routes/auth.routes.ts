import express from 'express';
import {
  login,
  register,
  getMe,
  updateUserProfile,
} from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticateToken, getMe);
router.post('/update', authenticateToken, updateUserProfile);

export default router;
