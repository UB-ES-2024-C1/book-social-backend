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
    industryIdentifiers?: {
      type: string; // e.g., "ISBN_10" or "ISBN_13"
      identifier: string; // e.g., "9780553804577"
    }[];
    averageRating?: number;
    ratingsCount?: number;
    language?: string;
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
  console.log(JSON.stringify(data, null, 2));

  return data.items || [];
}

function mapGoogleBookToEntity(googleBook: any): Book {
  // Extract the array of industry identifiers
  const industryIdentifiers = googleBook.volumeInfo.industryIdentifiers;
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

  // Prioritize ISBN_13, then fallback to ISBN_10, or leave empty
  book.ISBN = industryIdentifiers?.length
    ? industryIdentifiers[0].identifier // Pick the first identifier if available
    : ''; // Leave it empty if the array doesn't exist or is empty

  return book;
}

function booksToJSON(googleBooks: GoogleBook[], genre: string): any[] {
  return googleBooks.map((book) => {
    const { volumeInfo } = book;

    // Safely handle industryIdentifiers
    const ISBN =
      volumeInfo.industryIdentifiers?.find((id) => id.type === 'ISBN_13')
        ?.identifier || ''; // Default to an empty string if none are available

    return {
      title: volumeInfo.title || 'Unknown Title',
      author_name: volumeInfo.authors?.[0] || 'Unknown Author',
      synopsis: volumeInfo.description || null,
      image_url: volumeInfo.imageLinks?.thumbnail || null,
      publication_date: volumeInfo.publishedDate
        ? new Date(volumeInfo.publishedDate)
        : new Date(), // Default to the current date if not available
      genres: [genre], // Use categories if available, default to ["Fiction"]
      num_pages: volumeInfo.pageCount || null,
      publisher: volumeInfo.publisher || 'Unknown Publisher',
      ISBN,
      language: volumeInfo.language || 'en', // Default to English if not available
      categories: volumeInfo.categories,
      reviewValue: volumeInfo.averageRating || null,
      ratingCount: volumeInfo.ratingsCount || null,
    };
  });
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

export async function saveBooksToFile(
  query: string,
  fileName: string,
  genre: string
) {
  const filePath = path.resolve(__dirname, fileName);
  try {
    const googleBooks = await fetchBooksFromGoogle(query);
    console.log(
      `${googleBooks.length} books have been fetched from Google Books API.`
    );
    const booksJSON = booksToJSON(googleBooks, genre);
    await fs.writeFile(filePath, JSON.stringify(booksJSON, null, 2), 'utf-8');
    console.log(`Books data has been saved to ${filePath}`);
  } catch (error) {
    console.error('Error saving books data to file:', error);
  }
}

// List of genres and their corresponding file paths
const genres = [
  'Fiction',
  'Nonfiction',
  'Poetry',
  'Science',
  'Nature',
  'Fantasy',
  'Theatre',
  'Romance',
  'Comedy',
];

(async function () {
  try {
    for (const genre of genres) {
      const filePath = `./data/${genre.toLowerCase()}.json`; // Example: './data/fiction.json'
      await saveBooksToFile(genre, filePath, genre);
    }
  } catch (error) {
    console.error('Error migrating books:', error);
  }
})();
