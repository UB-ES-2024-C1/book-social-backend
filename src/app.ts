import express from 'express';
import { AppDataSource } from './config/database';
import authRoutes from './routes/auth.routes';

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

app.use('/auth', authRoutes);

// TODO: Error handling middleware
// app.use(futureErrorHandler)

export default app;
