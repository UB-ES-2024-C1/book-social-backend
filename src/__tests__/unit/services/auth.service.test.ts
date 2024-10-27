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
    jest.clearAllMocks();

    mockUser = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john@example.com',
      password: await bcrypt.hash('correctpassword', 10),
    } as User;

    userRepositoryMock = AppDataSource.getRepository(User);
    userRepositoryMock.findOne.mockReset();
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

  describe('Register', () => {
    it('should return error when email already exists', async () => {
      userRepositoryMock.findOne
        .mockResolvedValueOnce(mockUser) // Email check
        .mockResolvedValueOnce(null); // Username check

      const result = await registerUser(
        'John',
        'Doe',
        'newusername',
        'john@example.com',
        'password123'
      );

      expect(result).toEqual({
        user: null,
        error: 'Email already exists',
      });
    });

    it('should return error when username already exists', async () => {
      const findOneMock = userRepositoryMock.findOne;

      findOneMock
        .mockImplementationOnce(() => Promise.resolve(null)) // Primera llamada (email check)
        .mockImplementationOnce(() => Promise.resolve(mockUser)); // Segunda llamada (username check)

      const result = await registerUser(
        'John',
        'Doe',
        'johndoe',
        'newemail@example.com',
        'password123'
      );

      expect(findOneMock).toHaveBeenCalledTimes(2);
      expect(findOneMock).toHaveBeenNthCalledWith(1, {
        where: { email: 'newemail@example.com' },
      });
      expect(findOneMock).toHaveBeenNthCalledWith(2, {
        where: { username: 'johndoe' },
      });

      expect(result).toEqual({
        user: null,
        error: 'Username already exists',
      });
    });

    it('should create and return a new user for valid registration data', async () => {
      userRepositoryMock.findOne
        .mockResolvedValueOnce(null) // Email check
        .mockResolvedValueOnce(null); // Username check
      userRepositoryMock.create.mockReturnValue(mockUser);
      userRepositoryMock.save.mockResolvedValue(mockUser);

      const result = await registerUser(
        'John',
        'Doe',
        'johndoe',
        'john@example.com',
        'password123'
      );

      expect(result).toEqual({
        user: mockUser,
      });
      expect(result.user).toHaveProperty('id', 1);
    });
  });
});
