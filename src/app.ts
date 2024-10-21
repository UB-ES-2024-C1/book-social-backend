import express from 'express';
import { AppDataSource } from './config/database';

const app = express();

// Middleware
app.use(express.json());

// Initialize database connection
AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to BookSocial API!');
});

// TODO: Error handling middleware
// app.use(futureErrorHandler)

export default app;
