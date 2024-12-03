// Deshabilitar el mock de class-validator para este archivo
// ya que necesitamos las validaciones reales para probar la entidad
jest.unmock('class-validator');
import 'reflect-metadata';
import { AppDataSource } from '../../../config/database';
import { User } from '../../../entities/User';
import { loginUser, registerUser } from '../../../services/auth.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';

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
  let userRepositoryMock: jest.Mocked<Repository<User>>;
  let mockUser: User;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockUser = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john@example.com',
      password: await bcrypt.hash('ValidPass1!', 10),
    } as User;

    userRepositoryMock = AppDataSource.getRepository(User) as jest.Mocked<
      Repository<User>
    >;
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
    const result = await loginUser('john@example.com', 'ValidPass1!');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');

    const decoded = jwt.verify(result as string, process.env.JWT_SECRET);
    expect(decoded).toHaveProperty('id', 1);
  });

  describe('Register', () => {
    const validUserData = {
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john@example.com',
      password: 'ValidPass1!',
      genre: 'Science Fiction',
      description: 'Test description',
    };

    it('should return error when email already exists', async () => {
      userRepositoryMock.findOne
        .mockResolvedValueOnce(mockUser) // Email check
        .mockResolvedValueOnce(null); // Username check

      const result = await registerUser(
        validUserData.firstName,
        validUserData.lastName,
        validUserData.username,
        'john@example.com',
        validUserData.password,
        validUserData.genre,
        validUserData.description
      );

      expect(result).toEqual({
        user: null,
        error: 'Email already exists',
      });
    });

    it('should return error when username already exists', async () => {
      userRepositoryMock.findOne
        .mockResolvedValueOnce(null) // Email check
        .mockResolvedValueOnce(mockUser); // Username check

      const testData = {
        ...validUserData,
        email: 'newemail@example.com', // Different email
        username: 'johndoe', // Existing username
      };

      const result = await registerUser(
        testData.firstName,
        testData.lastName,
        testData.username,
        testData.email,
        testData.password,
        testData.genre,
        testData.description
      );

      expect(userRepositoryMock.findOne).toHaveBeenCalledTimes(2);
      expect(userRepositoryMock.findOne).toHaveBeenNthCalledWith(1, {
        where: { email: 'newemail@example.com' },
      });
      expect(userRepositoryMock.findOne).toHaveBeenNthCalledWith(2, {
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
      userRepositoryMock.save.mockResolvedValue(mockUser);

      const result = await registerUser(
        validUserData.firstName,
        validUserData.lastName,
        validUserData.username,
        validUserData.email,
        validUserData.password,
        validUserData.genre,
        validUserData.description
      );

      expect(result).toEqual({
        user: mockUser,
      });
      expect(result.user).toHaveProperty('id', 1);
    });

    it('should fail when genre is missing', async () => {
      const result = await registerUser(
        validUserData.firstName,
        validUserData.lastName,
        validUserData.username,
        validUserData.email,
        validUserData.password,
        '', // empty genre
        validUserData.description
      );

      expect(result).toEqual({
        user: null,
        error: expect.stringContaining('Literary genre is required'),
      });
    });

    it('should succeed when description is missing', async () => {
      userRepositoryMock.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      userRepositoryMock.save.mockResolvedValue({
        ...mockUser,
        description: undefined, // Ensure mock saved user has no description
      });

      const result = await registerUser(
        validUserData.firstName,
        validUserData.lastName,
        validUserData.username,
        validUserData.email,
        validUserData.password,
        validUserData.genre
        // description intentionally omitted
      );

      expect(result.user).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(userRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: validUserData.firstName,
          lastName: validUserData.lastName,
          username: validUserData.username,
          email: validUserData.email,
          genre: validUserData.genre,
          description: undefined,
        })
      );
    });

    it('should fail when genre is too long', async () => {
      const result = await registerUser(
        validUserData.firstName,
        validUserData.lastName,
        validUserData.username,
        validUserData.email,
        validUserData.password,
        'x'.repeat(51), // genre longer than 50 characters
        validUserData.description
      );

      expect(result).toEqual({
        user: null,
        error: expect.stringContaining(
          'Literary genre must be between 1 and 50 characters'
        ),
      });
    });

    it('should return error for invalid password format', async () => {
      const result = await registerUser(
        'John',
        'Doe',
        'johndoe',
        'john@example.com',
        'weakpass',
        validUserData.genre,
        validUserData.description
      );

      expect(result).toEqual({
        user: null,
        error: expect.stringContaining('Password must contain'),
      });
    });
  });
});
