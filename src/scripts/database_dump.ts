import { DataSource } from 'typeorm';
import { Book } from '../entities/Book'; // Adjust the path to your Book entity file
import { User, UserRole } from '../entities/User'; // Adjust the path to your User entity file
import { Review } from '../entities/Review';
import fs from 'fs';
import path from 'path';

// Initialize your database connection
const AppDataSource = new DataSource({
  type: 'postgres',
  url: 'postgresql://postgres:DMMbWEkNoswdVIzVZAfPceaOWfhDAJbj@autorack.proxy.rlwy.net:59014/railway',
  synchronize: false, // Use migrations in production
  logging: true,
  entities: [User, Book, Review], // Ensure your Book entity is included
});

// Function to load books from a JSON file
const loadBooksFromJson = (filePath: string) => {
  try {
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Error reading JSON file:', error);
    return [];
  }
};

async function addBooks() {
  try {
    // Load books from JSON
    const booksFilePath = path.resolve(__dirname, './books.json'); // Adjust path if needed
    const books = loadBooksFromJson(booksFilePath);

    if (books.length === 0) {
      console.log('No books to add.');
      return;
    }

    // Initialize the data source
    await AppDataSource.initialize();
    console.log('Database connected!');

    const bookRepository = AppDataSource.getRepository(Book);
    const userRepository = AppDataSource.getRepository(User);

    // Insert books into the database
    for (const bookData of books) {
      const existingBook = await bookRepository.findOneBy({
        title: bookData.title,
      });

      if (!existingBook) {
        const authorNameParts = bookData.author_name.split(' ');
        const firstName = authorNameParts[0];
        const lastName = authorNameParts[1] || 'lastName'; // Use empty string if last name is missing
        let authorUser = await userRepository.findOneBy({
          firstName: firstName,
          lastName: lastName,
        });

        if (!authorUser) {
          const randomEmail = `${firstName.toLowerCase()}${lastName.toLowerCase()}@example.com`;
          const randomPassword = `${firstName.toLowerCase()}${lastName.toLowerCase()}123`;

          // Create a new user for the author if not found
          authorUser = userRepository.create({
            firstName: firstName,
            lastName: lastName || 'lastName', // Use null if no last name
            username: `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
            email: randomEmail,
            password: randomPassword,
            role: UserRole.WRITER,
          });

          await userRepository.save(authorUser);
          console.log(`User "${bookData.author_name}" created.`);
        }

        // Create and save the book
        const book = bookRepository.create({
          title: bookData.title,
          publication_date: bookData.publication_date,
          genres: bookData.genres,
          synopsis: bookData.synopsis,
          image_url: bookData.image_url,
          num_pages: bookData.num_pages,
          publisher: bookData.publisher,
          author: authorUser, // Link the book to the author
        });

        await bookRepository.save(book);

        console.log(`Book "${book.title}" added successfully!`);
      } else {
        console.log(`Book "${bookData.title}" already exists. Skipping.`);
      }
    }
  } catch (error) {
    console.error('Error adding books:', error);
  } finally {
    await AppDataSource.destroy(); // Close the connection
  }
}

// Run the script
addBooks();
