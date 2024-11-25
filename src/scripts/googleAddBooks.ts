import { AppDataSource } from '../config/database';
import { Book } from '../entities/Book';
import { User } from '../entities/User';
import { promises as fs } from 'fs';
import path from 'path';

const bookRepository = AppDataSource.getRepository(Book);

interface GoogleBook {
  volumeInfo: {
    title?: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail?: string;
    };
    publishedDate?: string;
    categories?: string[];
    pageCount?: number;
    publisher?: string;
  };
}

interface GoogleBooksAPIResponse {
  items: GoogleBook[];
}

async function fetchBooksFromGoogle(query: string) {
  const apiKey = 'AIzaSyDhg2Af0weG38BXyZ2JAA1PUpzUDaUcSzo'; // Assegura't de protegir aquesta clau!
  const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${apiKey}`;
  const fetch = (await import('node-fetch-commonjs')).default;
  const headers = {
    'Accept-Encoding': 'identity',
    'User-Agent': 'my program (gzip)', // Custom user agent
  };
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Error: ${response.status} - ${response.statusText}`);
  }
  console.log('response', response);

  const data = (await response.json()) as GoogleBooksAPIResponse;
  //console.log(JSON.stringify(data, null, 2));

  return data.items || [];
}

function mapGoogleBookToEntity(googleBook: any): Book {
  const book = new Book();
  book.title = googleBook.volumeInfo.title || 'Unknown Title';
  book.author = googleBook.volumeInfo.authors[0] || 'Unknown Author';
  book.synopsis = googleBook.volumeInfo.description || null;
  book.image_url = googleBook.volumeInfo.imageLinks?.thumbnail || null;
  book.publication_date = googleBook.volumeInfo.publishedDate
    ? new Date(googleBook.volumeInfo.publishedDate)
    : new Date();
  book.genres = ['Non-fiction'];
  book.num_pages = googleBook.volumeInfo.pageCount || null;
  book.publisher = googleBook.volumeInfo.publisher || null;

  return book;
}

function booksToJSON(googleBooks: GoogleBook[]): any[] {
  return googleBooks.map((book) => ({
    title: book.volumeInfo.title || 'Unknown Title',
    author_name: book.volumeInfo.authors?.[0] || 'Unknown Author',
    synopsis: book.volumeInfo.description || null,
    image_url: book.volumeInfo.imageLinks?.thumbnail || null,
    publication_date: book.volumeInfo.publishedDate
      ? new Date(book.volumeInfo.publishedDate)
      : new Date(),
    genres: ['Fiction'],
    num_pages: book.volumeInfo.pageCount || null,
    publisher: book.volumeInfo.publisher || 'Unknown Publisher',
  }));
}

async function saveBooksToDatabase(booksData: any[]) {
  const books = booksData.map(mapGoogleBookToEntity);

  await bookRepository.save(books);
  console.log(`${books.length} books have been saved to the database.`);
}

export async function migrateBooks(query: string) {
  try {
    const googleBooks = await fetchBooksFromGoogle(query);
    console.log(
      `${googleBooks.length} books have been fetched from Google Books API.`
    );
    await saveBooksToDatabase(googleBooks);
  } catch (error) {
    console.error('Error migrating books:', error);
  }
}

export async function saveBooksToFile(query: string, fileName: string) {
  const filePath = path.resolve(__dirname, fileName);
  try {
    const googleBooks = await fetchBooksFromGoogle(query);
    console.log(
      `${googleBooks.length} books have been fetched from Google Books API.`
    );
    const booksJSON = booksToJSON(googleBooks);
    await fs.writeFile(filePath, JSON.stringify(booksJSON, null, 2), 'utf-8');
    console.log(`Books data has been saved to ${filePath}`);
  } catch (error) {
    console.error('Error saving books data to file:', error);
  }
}

(async function () {
  try {
    saveBooksToFile('love', './books.json');
  } catch (error) {
    console.error('Error migrating books:', error);
  }
})();
