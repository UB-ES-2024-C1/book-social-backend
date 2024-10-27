import { login, register } from '../../../controllers/auth.controller';
import { loginUser, registerUser } from '../../../services/auth.service';

// Mock the auth service
jest.mock('../../../services/auth.service', () => ({
  loginUser: jest.fn(),
  registerUser: jest.fn(),
}));

describe('Auth Controller - Login', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should return 401 for invalid credentials', async () => {
    req.body = { email: 'john@example.com', password: 'wrongpassword' };
    jest
      .spyOn(require('../../../services/auth.service'), 'loginUser')
      .mockResolvedValue(null);

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
  });

  it('should return 200 and token for valid credentials', async () => {
    req.body = { email: 'john@example.com', password: 'correctpassword' };
    const mockToken = 'mockjwttoken';
    jest
      .spyOn(require('../../../services/auth.service'), 'loginUser')
      .mockResolvedValue(mockToken);

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ token: mockToken });
  });

  it('should call next with error on exception', async () => {
    req.body = { email: 'john@example.com', password: 'correctpassword' };
    const mockError = new Error('Test error');
    jest
      .spyOn(require('../../../services/auth.service'), 'loginUser')
      .mockRejectedValue(mockError);

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error logging in',
      error: mockError,
    });
  });
});

describe('Auth Controller - Register', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should return 400 for invalid registration data', async () => {
    req.body = {};

    await register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Missing required fields',
    });
  });

  it('should return 400 if email already exists', async () => {
    req.body = {
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'existing@example.com',
      password: 'password123',
    };

    (registerUser as jest.Mock).mockResolvedValue({
      user: null,
      error: 'Email already exists',
    });

    await register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Email already exists',
    });
  });

  it('should return 400 if username already exists', async () => {
    req.body = {
      firstName: 'John',
      lastName: 'Doe',
      username: 'existinguser',
      email: 'new@example.com',
      password: 'password123',
    };

    (registerUser as jest.Mock).mockResolvedValue({
      user: null,
      error: 'Username already exists',
    });

    await register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Username already exists',
    });
  });

  it('should return 201 and userId for successful registration', async () => {
    req.body = {
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john@example.com',
      password: 'password123',
    };

    const mockUser = { id: 1 };
    (registerUser as jest.Mock).mockResolvedValue({
      user: mockUser,
    });

    await register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User registered successfully',
      userId: mockUser.id,
    });
  });

  it('should call next with error on exception', async () => {
    req.body = {
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john@example.com',
      password: 'password123',
    };
    const mockError = new Error('Test error');
    (registerUser as jest.Mock).mockRejectedValue(mockError);

    await register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error registering user',
      error: mockError,
    });
  });
});
