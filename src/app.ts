import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database';
import authRoutes from './routes/auth.routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
