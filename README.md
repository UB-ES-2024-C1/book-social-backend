# book-social-backend
BookSocial Backend

## Development Environment Setup Guide

This guide will help you set up your local environment for BookSocial Backend repository using Node.js, PNPM, TypeScript, Express, and PostgreSQL. This guide is specifically designed for a Linux environment.

### Prerequisites

- Git
- A Linux-based operating system

### Steps

#### 1. Install Node.js

```bash
sudo apt update
sudo apt install nodejs
node --version
npm --version
```

#### 2. Install PNPM

```bash
sudo npm install -g pnpm
pnpm --version
```

#### 3. Install PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib
psql --version
```

#### 4. Configure PostgreSQL

In this step, we configure PostgreSQL for our BookSocial application.

1. Start the PostgreSQL service:
   ```bash
   sudo systemctl start postgresql
   ```

2. Enable PostgreSQL to start on boot:
   ```bash
   sudo systemctl enable postgresql
   ```

3. Access the PostgreSQL command line as the postgres user:
   ```bash
   sudo -u postgres psql
   ```

4. Create a new user for our application:
   ```sql
   CREATE USER book_social_user WITH PASSWORD 'book_social';
   ```

5. Create a new database for our application:
   ```sql
   CREATE DATABASE book_social_psql;
   ```

6. Grant all privileges on the new database to our new user:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE book_social_psql TO book_social_user;
   ```

7. Exit the PostgreSQL command line:
   ```sql
   \q
   ```

These commands set up a new PostgreSQL user and database specifically for the BookSocial application, ensuring proper isolation and security.

#### 5. Install Dependencies

In the project root, run the following command to install the dependencies:

```bash
pnpm install
```

#### 6. Set Up Environment Variables

Create a `.env` file in the project root using the `.env.example` file as a template:

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=your_database_name
```
#### 7. Running the Application

To start the development server, run the following command:

```bash
pnpm run dev
```

This will start the server using nodemon, which will automatically restart the server when file changes are detected.

To run the application in production mode, use:
```bash
pnpm start
```

#### 8. Linting and Formatting

This project uses ESLint for linting and Prettier for code formatting. To run the linter, use:

```bash
pnpm lint
```

To automatically fix linting issues:
```bash
pnpm lint:fix
```

To format the code using Prettier:
```bash
pnpm format
```

#### 9. Project Structure

The main directories and files in the project are:

- `src/`: Contains the source code of the application
  - `config/`: Configuration files, including database setup
  - `controllers/`: Request handlers
  - `entities/`: TypeORM entities
  - `middlewares/`: Express middlewares
  - `models/`: Data models
  - `routes/`: API route definitions
  - `services/`: Business logic
  - `utils/`: Utility functions
  - `app.ts`: Express application setup
  - `server.ts`: Server entry point
- `package.json`: Project dependencies and scripts
- `tsconfig.json`: TypeScript configuration
- `.eslintrc`: ESLint configuration
- `.prettierignore`: Prettier ignore file
- `.prettierrc`: Prettier configuration
- `package.json`: Project dependencies and scripts
- `pnpm-lock.yaml`: PNPM lock file
- `README.md`: This file

#### 10. TypeORM Configuration

This project uses TypeORM for database operations. The TypeORM configuration can be found in `src/config/database.ts`. To create new entities (Tables), add them to the `src/entities` directory.
