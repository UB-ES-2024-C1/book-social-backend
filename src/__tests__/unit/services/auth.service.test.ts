import { AppDataSource } from '../../../config/database';
import { User } from '../../../entities/User';
import { loginUser, registerUser } from '../../../services/auth.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock the database connection
jest.mock('../../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn().mockReturnValue({
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    }),
  },
}));

describe('Auth Service', () => {
  let userRepositoryMock: any;
  let mockUser: User;

  beforeEach(async () => {
    // Create a mock user
    mockUser = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john@example.com',
      password: await bcrypt.hash('correctpassword', 10),
    } as User;

    userRepositoryMock = AppDataSource.getRepository(User);
  });

  it('should return null for non-existent user', async () => {
    userRepositoryMock.findOne.mockResolvedValue(null);

    const result = await loginUser('nonexistent@example.com', 'password');
    expect(result).toBeNull();
  });

  it('should return null for invalid password', async () => {
    userRepositoryMock.findOne.mockResolvedValue(mockUser);

    const result = await loginUser('john@example.com', 'wrongpassword');
    expect(result).toBeNull();
  });

  it('should return a token for valid credentials', async () => {
    userRepositoryMock.findOne.mockResolvedValue(mockUser);

    process.env.JWT_SECRET = 'testsecret';
    const result = await loginUser('john@example.com', 'correctpassword');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');

    const decoded = jwt.verify(result as string, process.env.JWT_SECRET);
    expect(decoded).toHaveProperty('id', 1);
  });

  it('should return null for existing user during registration', async () => {
    userRepositoryMock.findOne.mockResolvedValue(mockUser);

    const result = await registerUser('John', 'Doe', 'johndoe', 'john@example.com', 'password123');
    expect(result).toBeNull();
  });

  it('should create and return a new user for valid registration data', async () => {
    userRepositoryMock.findOne.mockResolvedValue(null); // No existing user
    userRepositoryMock.create.mockReturnValue(mockUser);
    userRepositoryMock.save.mockResolvedValue(mockUser);

    const result = await registerUser('John', 'Doe', 'johndoe', 'john@example.com', 'password123');
    expect(result).toEqual(mockUser);
    expect(result).toHaveProperty('id', 1);
  });
});
