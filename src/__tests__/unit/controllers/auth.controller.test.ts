import { login } from '../../../controllers/auth.controller';

// Mock the auth service
jest.mock('../../../services/auth.service', () => ({
  loginUser: jest.fn(),
}));

describe('Auth Controller', () => {
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
    req.body = { email: 'john@example.com', password: 'ValidPass1!' };
    jest
      .spyOn(require('../../../services/auth.service'), 'loginUser')
      .mockResolvedValue(null);

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
  });

  it('should return 200 and token for valid credentials', async () => {
    req.body = { email: 'john.doe@example.com', password: 'ValidPass1!' };
    const mockToken = 'mockjwttoken';
    jest
      .spyOn(require('../../../services/auth.service'), 'loginUser')
      .mockResolvedValue(mockToken);

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ token: mockToken });
  });

  it('should call next with error on exception', async () => {
    req.body = { email: 'john@example.com', password: 'ValidPass1!' };
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

  it('should return 400 for invalid email format', async () => {
    req.body = { email: 'invalidemail', password: 'ValidPass1!' };
    
    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email format' });
  });

  it('should return 400 for invalid password format', async () => {
    req.body = { email: 'john.doe@example.com', password: 'short' };
    
    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Password must be at least 8 characters long, contain uppercase and lowercase letters, numbers, and special characters' });
  });

  it('should return 400 for both invalid email and password', async () => {
    req.body = { email: 'invalidemail', password: 'short' };
    
    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email format' }); // Prioritizes email error
  });
});
