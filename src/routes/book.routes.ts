import express from 'express';
import { create } from '../controllers/book.controller';

const router = express.Router();

router.post('/', create);

export default router;
