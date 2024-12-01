import express from 'express';
import request from 'supertest';
import authRoutes from '../../../routes/auth.routes';
import { login, register, getMe } from '../../../controllers/auth.controller';
import { authenticateToken } from '../../../middleware/auth.middleware';

// Mock the controllers and middleware
jest.mock('../../../controllers/auth.controller');
jest.mock('../../../middleware/auth.middleware');

describe('Auth Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    // Create a new express application for each test
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should route to login controller', async () => {
      const mockLoginController = login as jest.Mock;
      mockLoginController.mockImplementation((req, res) => {
        res.status(200).json({ token: 'test-token' });
      });

      await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'Password123!' })
        .expect(200);

      expect(mockLoginController).toHaveBeenCalled();
    });
  });

  describe('POST /auth/register', () => {
    it('should route to register controller', async () => {
      const mockRegisterController = register as jest.Mock;
      mockRegisterController.mockImplementation((req, res) => {
        res.status(201).json({ message: 'User registered successfully', userId: 1 });
      });

      await request(app)
        .post('/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
          email: 'john@example.com',
          password: 'Password123!',
          genre: 'Fiction'
        })
        .expect(201);

      expect(mockRegisterController).toHaveBeenCalled();
    });
  });

  describe('GET /auth/me', () => {
    it('should use authenticateToken middleware', async () => {
      const mockAuthMiddleware = authenticateToken as jest.Mock;
      mockAuthMiddleware.mockImplementation((req, res, next) => next());

      const mockGetMeController = getMe as jest.Mock;
      mockGetMeController.mockImplementation((req, res) => {
        res.status(200).json({
          name: 'John',
          email: 'john@example.com',
          description: '',
          id: '1',
          lastname: 'Doe',
          username: 'johndoe',
          role: 'reader',
          favGenre: 'Fiction',
          image: '',
          coverImage: '',
          posts: []
        });
      });

      await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(mockAuthMiddleware).toHaveBeenCalled();
      expect(mockGetMeController).toHaveBeenCalled();
    });

    it('should return 401 when no token is provided', async () => {
      const mockAuthMiddleware = authenticateToken as jest.Mock;
      mockAuthMiddleware.mockImplementation((req, res) => {
        res.status(401).json({ message: 'Authentication token required' });
      });

      await request(app)
        .get('/auth/me')
        .expect(401)
        .expect('Content-Type', /json/)
        .expect((res: { body: { message: string; }; }) => {
          expect(res.body).toEqual({
            message: 'Authentication token required'
          });
        });
    });
  });

  describe('Invalid routes', () => {
    it('should return 404 for undefined auth routes', async () => {
      await request(app)
        .get('/auth/invalid-route')
        .expect(404);
    });
  });
});