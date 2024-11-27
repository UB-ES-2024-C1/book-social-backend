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

#### 7. Available Scripts

The project includes several PNPM scripts for different tasks:

**Development and Build:**

```bash
# Start the server in production mode
pnpm start

# Start the server in development mode with automatic reload
pnpm dev

# Compile the TypeScript project
pnpm build
```

**Testing:**

```bash
# Run all tests
pnpm test

# Run tests in watch mode (useful during development)
pnpm test:watch

# Run only unit tests
pnpm test:unit

# Run only integration tests
pnpm test:integration

# Generate a code coverage report
pnpm test:coverage

# Run tests in CI environment with specific report
pnpm test:ci
```

The coverage reports are generated in the `coverage/` directory and include:

- Summary in console (text-summary)
- Interactive HTML report
- Additional formats (lcov, clover, json) for integration with tools

**Code Quality:**

```bash
# Run the linter to check the code
pnpm lint

# Automatically fix linting issues
pnpm lint:fix

# Format the code using Prettier
pnpm format
```

**Coverage Thresholds:**
The project maintains strict quality standards with minimum coverage thresholds:

- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

#### 8. API Documentation (Swagger)

The API documentation is available through Swagger UI. Once the application is running, you can access the documentation at:

```
http://localhost:3000/api-docs
```

This interactive documentation allows you to:

- Browse all available API endpoints
- See detailed request/response schemas
- Test API endpoints directly from the browser
- View authentication requirements

#### 9. Linting and Formatting

The project uses a combination of tools to maintain code quality:

**ESLint:**

- Configured with specific rules for TypeScript
- Integrated with Prettier to avoid conflicts
- Custom rules in `.eslintrc`

**Prettier:**

- Consistent code formatting
- Configuration in `.prettierrc`
- Ignored files in `.prettierignore`

**Recommended Workflow:**

1. Use `pnpm format` before commits
2. Run `pnpm lint` to check for issues
3. Use `pnpm lint:fix` for automatic fixes
4. Run tests with `pnpm test` before push

#### 10. Project Structure

The project structure is organized as follows:

```
src/
├── __tests__/           # Tests organized by type
│   ├── integration/     # Integration tests
│   └── unit/           # Unit tests
├── config/             # Configurations (DB, Swagger, etc.)
├── controllers/        # Route controllers
├── docs/              # Swagger/OpenAPI documentation
├── entities/          # TypeORM entities
├── middlewares/       # Express middlewares
├── routes/            # Route definitions
├── services/          # Business logic
├── utils/             # Utilities and helpers
├── app.ts            # Express configuration
└── server.ts         # Entry point

config/
├── jest.config.js     # Jest configuration
├── tsconfig.json      # TypeScript configuration
└── .env              # Environment variables (not in repo)
```

#### 11. TypeORM Configuration

This project uses TypeORM for database operations. The TypeORM configuration can be found in `src/config/database.ts`. To create new entities (Tables), add them to the `src/entities` directory.

#### 12. Add books from GoogleAPI

In `src/config` there is two scripts `addGoogleBooks.ts` and `database_dumb.ts`. The first saves a json of 10 books, the second reads the json and adds this books to the database.

To run them:

```
pnpm run build
node addGoogleBooks.js
node database_dumb.js
```
