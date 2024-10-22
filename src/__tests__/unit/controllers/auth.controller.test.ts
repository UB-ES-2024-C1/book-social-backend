import { login } from '@controllers/auth.controller';

// Mock the auth service
jest.mock('../../services/auth.service', () => ({
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
    req.body = { email: 'john@example.com', password: 'wrongpassword' };
    jest.spyOn(require('../../services/auth.service'), 'loginUser').mockResolvedValue(null);

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
  });

  it('should return 200 and token for valid credentials', async () => {
    req.body = { email: 'john@example.com', password: 'correctpassword' };
    const mockToken = 'mockjwttoken';
    jest.spyOn(require('../../services/auth.service'), 'loginUser').mockResolvedValue(mockToken);

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ token: mockToken });
  });

  it('should call next with error on exception', async () => {
    req.body = { email: 'john@example.com', password: 'correctpassword' };
    const mockError = new Error('Test error');
    jest.spyOn(require('../../services/auth.service'), 'loginUser').mockRejectedValue(mockError);

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Error logging in', error: mockError });
  });
});

