import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Book } from '../entities/Book';
import { User } from '../entities/User';
import { UserRole } from '../entities/User';
import axios from 'axios';
import { Review } from '../entities/Review';

interface OpenLibraryWork {
  key: string;
  title: string;
  first_publish_date?: string;
  cover_id?: number;
  subject?: string[];
  rating_average?: number;
  rating_count?: number;
}

interface OpenLibraryBookDetails {
  description?: { value: string } | string;
  number_of_pages?: number;
  publishers?: string[];
  isbn_13?: string[];
  isbn_10?: string[];
  languages?: Array<{ key: string }>;
  edition_name?: string;
}

// Definir géneros principales y sus subgéneros
const GENRES_MAP = {
  Fiction: ['Contemporary Fiction', 'Literary Fiction', 'Historical Fiction'],
  'Non-fiction': ['Biography', 'History', 'Science', 'Self-Help'],
  Poetry: ['Modern Poetry', 'Classical Poetry', 'Lyric Poetry'],
  Theater: ['Drama', 'Comedy', 'Tragedy', 'Musical'],
  Fantasy: ['Epic Fantasy', 'Urban Fantasy', 'Dark Fantasy'],
};

// Función auxiliar para seleccionar géneros aleatorios
function getRandomGenres(): string[] {
  const mainGenres = Object.keys(GENRES_MAP);
  const mainGenre = mainGenres[Math.floor(Math.random() * mainGenres.length)];
  const subGenres = GENRES_MAP[mainGenre as keyof typeof GENRES_MAP];
  const subGenre = subGenres[Math.floor(Math.random() * subGenres.length)];

  return [mainGenre, subGenre];
}

async function fetchBooksFromAPI(): Promise<OpenLibraryWork[]> {
  const response = await axios.get(
    'https://openlibrary.org/subjects/fiction.json?limit=100'
  );
  return response.data.works;
}

async function transformBookData(
  bookData: OpenLibraryWork,
  defaultAuthor: User
): Promise<Partial<Book>> {
  try {
    const bookDetailsResponse = await axios.get(
      `https://openlibrary.org${bookData.key}.json`
    );
    const bookDetails = bookDetailsResponse.data as OpenLibraryBookDetails;

    // Obtener ISBN de la API de ediciones
    const editionsResponse = await axios.get(
      `https://openlibrary.org${bookData.key}/editions.json`
    );
    const editions = editionsResponse.data.entries[0];

    // Generar rating aleatorio entre 3.5 y 5
    const randomRating = (Math.random() * 1.5 + 3.5).toFixed(1);
    // Generar count aleatorio entre 100 y 1000
    const randomCount = Math.floor(Math.random() * 900 + 100);

    return {
      title: bookData.title,
      author: defaultAuthor,
      publication_date: new Date(bookData.first_publish_date || '2000-01-01'),
      genres: getRandomGenres(),
      categories: bookData.subject?.slice(0, 10) || [],
      synopsis:
        typeof bookDetails.description === 'object'
          ? bookDetails.description.value
          : bookDetails.description || undefined,
      image_url: bookData.cover_id
        ? `https://covers.openlibrary.org/b/id/${bookData.cover_id}-L.jpg`
        : undefined,
      num_pages:
        editions.number_of_pages || Math.floor(Math.random() * 300 + 100),
      publisher: editions.publishers?.[0] || 'Unknown Publisher',
      reviewValue: parseFloat(randomRating),
      ratingCount: randomCount,
      ISBN:
        editions.isbn_13?.[0] ||
        editions.isbn_10?.[0] ||
        String(Math.floor(Math.random() * 9000000000000) + 1000000000000),
      language: bookDetails.languages?.[0]?.key?.split('/')?.[2] || 'eng',
      edition:
        editions.edition_name || `Edition ${Math.floor(Math.random() * 5) + 1}`,
    };
  } catch (error) {
    console.error(`Error transforming book ${bookData.title}:`, error);
    // Valores por defecto en caso de error
    return {
      title: bookData.title,
      author: defaultAuthor,
      publication_date: new Date('2000-01-01'),
      genres: getRandomGenres(),
      num_pages: Math.floor(Math.random() * 300 + 100),
      reviewValue: 4.0,
      ratingCount: 100,
      ISBN: String(Math.floor(Math.random() * 9000000000000) + 1000000000000),
    };
  }
}

async function loadBooks(databaseUrl: string) {
  // Configurar conexión a la base de datos
  const AppDataSource = new DataSource({
    type: 'postgres',
    url: databaseUrl,
    synchronize: true,
    logging: false,
    entities: [Book, User, Review],
  });

  try {
    // Inicializar conexión
    await AppDataSource.initialize();
    console.log('Connected to database');

    // Crear un autor por defecto si no existe
    const userRepository = AppDataSource.getRepository(User);
    let defaultAuthor = await userRepository.findOne({
      where: { email: 'default@author.com' },
    });

    if (!defaultAuthor) {
      defaultAuthor = userRepository.create({
        firstName: 'Default',
        lastName: 'Author',
        email: 'default@author.com',
        username: 'defaultauthor',
        password: 'DefaultPassword123!',
        genre: 'Fiction',
        role: UserRole.WRITER,
        description: 'Default author for imported books',
      } as Partial<User>);
      await userRepository.save(defaultAuthor);
    }

    // Obtener datos de la API
    console.log('Fetching books from API...');
    const booksData = await fetchBooksFromAPI();

    // Guardar libros en la base de datos
    const bookRepository = AppDataSource.getRepository(Book);
    let savedCount = 0;

    for (const bookData of booksData) {
      try {
        const transformedBook = await transformBookData(
          bookData,
          defaultAuthor
        );
        const book = bookRepository.create(transformedBook);
        await bookRepository.save(book);
        savedCount++;
        console.log(`Saved book: ${book.title}`);
      } catch (error) {
        console.error(`Error saving book ${bookData.title}:`, error);
      }
    }

    console.log(`Successfully loaded ${savedCount} books`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

// Uso del script
if (require.main === module) {
  const databaseUrl = process.argv[2];
  if (!databaseUrl) {
    console.error('Please provide database URL as argument');
    process.exit(1);
  }

  loadBooks(databaseUrl)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
