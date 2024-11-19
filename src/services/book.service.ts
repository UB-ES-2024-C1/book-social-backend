import { AppDataSource } from '../config/database';
import { Book } from '../entities/Book';

const bookRepository = AppDataSource.getRepository(Book);

export const getBook = async (id: number): Promise<Book | null> => {
  const book = await bookRepository.findOne({ where: { id } });
  if (!book) return null;
  return book;
};
