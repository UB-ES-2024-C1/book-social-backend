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
  synchronize: true, // Use migrations in production
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

// Function to process books from a JSON file
async function processBooks(filePath: string) {
  try {
    const books = loadBooksFromJson(filePath);

    if (books.length === 0) {
      console.log(`No books found in file: ${filePath}`);
      return;
    }

    const bookRepository = AppDataSource.getRepository(Book);
    const userRepository = AppDataSource.getRepository(User);

    for (const bookData of books) {
      const existingBook = await bookRepository.findOneBy({
        title: bookData.title,
      });

      if (!existingBook) {
        const authorNameParts = bookData.author_name.split(' ');
        const firstName = authorNameParts[0];
        const lastName = authorNameParts[1] || 'lastName';

        let authorUser = await userRepository.findOneBy({
          firstName: firstName,
          lastName: lastName,
        });

        if (!authorUser) {
          const randomEmail = `${firstName.toLowerCase()}${lastName.toLowerCase()}@example.com`;
          const randomPassword = `${firstName.toLowerCase()}${lastName.toLowerCase()}123`;

          authorUser = userRepository.create({
            firstName: firstName,
            lastName: lastName,
            username: `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
            email: randomEmail,
            password: randomPassword,
            role: UserRole.WRITER,
          });

          await userRepository.save(authorUser);
          console.log(`User "${bookData.author_name}" created.`);
        }

        const book = bookRepository.create({
          title: bookData.title,
          publication_date: bookData.publication_date,
          genres: bookData.genres,
          synopsis: bookData.synopsis,
          image_url: bookData.image_url,
          num_pages: bookData.num_pages,
          publisher: bookData.publisher,
          author: authorUser,
          ISBN: bookData.ISBN,
          categories: bookData.categories,
          reviewValue: bookData.reviewValue,
          ratingCount: bookData.ratingCount,
          language: bookData.language,
        });

        await bookRepository.save(book);

        console.log(`Book "${book.title}" added successfully!`);
      } else {
        console.log(`Book "${bookData.title}" already exists. Skipping.`);
      }
    }
  } catch (error) {
    console.error(`Error processing file "${filePath}":`, error);
  }
}

// Main function to process all files in the 'data' folder
async function addBooks() {
  try {
    const dataFolderPath = path.resolve(__dirname, './data');

    // Ensure the folder exists
    if (!fs.existsSync(dataFolderPath)) {
      console.error(`Folder "data" not found at path: ${dataFolderPath}`);
      return;
    }

    // Initialize the data source
    await AppDataSource.initialize();
    console.log('Database connected!');

    // Get all JSON files in the folder
    const files = fs
      .readdirSync(dataFolderPath)
      .filter((file) => file.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(dataFolderPath, file);
      console.log(`Processing file: ${filePath}`);
      await processBooks(filePath);
    }
  } catch (error) {
    console.error('Error adding books:', error);
  } finally {
    await AppDataSource.destroy(); // Close the connection
    console.log('Database connection closed.');
  }
}

// Run the script
addBooks();
