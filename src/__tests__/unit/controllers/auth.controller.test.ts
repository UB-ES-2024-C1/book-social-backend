import { login, register } from '../../../controllers/auth.controller';
import { UserRole } from '../../../entities/User';
import { registerUser, loginUser } from '../../../services/auth.service';
import { Request, Response } from 'express';

// Mock the auth service
jest.mock('../../../services/auth.service', () => ({
  loginUser: jest.fn(),
  registerUser: jest.fn(),
}));

describe('Auth Controller - Login', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should return 401 for invalid credentials', async () => {
    req.body = { email: 'john@example.com', password: 'ValidPass1!' };
    jest.spyOn({ loginUser }, 'loginUser').mockResolvedValue(null);

    await login(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
  });

  it('should return 200 and token for valid credentials', async () => {
    req.body = { email: 'john.doe@example.com', password: 'ValidPass1!' };
    const mockToken = 'mockjwttoken';
    jest.spyOn({ loginUser }, 'loginUser').mockResolvedValue(mockToken);

    await login(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ token: mockToken });
  });

  it('should call next with error on exception', async () => {
    req.body = { email: 'john@example.com', password: 'ValidPass1!' };
    const mockError = new Error('Test error');
    jest.spyOn({ loginUser }, 'loginUser').mockRejectedValue(mockError);

    await login(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error logging in',
      error: mockError,
    });
  });

  it('should return 400 for invalid email format', async () => {
    req.body = { email: 'invalidemail', password: 'ValidPass1!' };

    await login(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Validation failed',
      errors: ['Invalid email format'],
    });
  });

  it('should return 400 for invalid password format', async () => {
    req.body = { email: 'john.doe@example.com', password: 'short' };

    await login(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Validation failed',
      errors: [
        'Password must be at least 8 characters long, contain uppercase and lowercase letters, numbers, and special characters',
      ],
    });
  });

  it('should return 400 for both invalid email and password', async () => {
    req.body = { email: 'invalidemail', password: 'short' };

    await login(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Validation failed',
      errors: [
        'Invalid email format',
        'Password must be at least 8 characters long, contain uppercase and lowercase letters, numbers, and special characters',
      ],
    });
  });
});

describe('Auth Controller - Register', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  const mockValidUser = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    username: 'testuser',
    password: 'Password123!',
    genre: 'Fiction',
    role: UserRole.READER
  };

  it('should return 400 for invalid registration data', async () => {
    req.body = {};

    await register(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Validation failed',
      errors: [
        'First name is required',
        'Last name is required',
        'Username is required',
        'Email is required',
        'Password is required',
        'Literary genre is required',
        'Invalid email format',
        'Password must be at least 8 characters long, contain uppercase and lowercase letters, numbers, and special characters',
      ],
    });
  });

  it('should return 400 if email already exists', async () => {
    const req = {
      body: { ...mockValidUser }
    };
    
    (registerUser as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Email already exists'
    });

    await register(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Email already exists'
    });
  });

  it('should return 400 if username already exists', async () => {
    const req = {
      body: { ...mockValidUser }
    };
    
    (registerUser as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Username already exists'
    });

    await register(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Username already exists'
    });
  });

  it('should return 201 and userId for successful registration', async () => {
    const req = {
      body: { ...mockValidUser }
    };
    
    const mockUser = { id: 1, ...mockValidUser };
    (registerUser as jest.Mock).mockResolvedValue({
      success: true,
      user: mockUser
    });

    await register(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User registered successfully',
      userId: mockUser.id
    });
  });

  it('should call next with error on exception', async () => {
    const mockError = new Error('Database error');
    const req = {
      body: { ...mockValidUser }
    };

    (registerUser as jest.Mock).mockRejectedValue(mockError);

    await register(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error registering user',
      error: mockError
    });
  });
});
