import { Request, Response } from 'express';
import {
  createPost,
  getAllPosts,
  getPostsByUserId,
} from '../../../controllers/post.controller';
import { AppDataSource } from '../../../config/database';
import { User, UserRole } from '../../../entities/User';
import { Post } from '../../../entities/Post';
import { Repository } from 'typeorm';

jest.mock('../../../config/database');

describe('Post Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockPostRepository: jest.Mocked<Repository<Post>>;

  beforeEach(() => {
    mockRequest = {
      user: {
        id: 1,
        username: 'testuser',
      } as User,
      body: {
        content: 'Test post content',
        imageUrls: ['https://example.com/image1.jpg'],
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockPostRepository = {
      save: jest.fn(),
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<Post>>;

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(
      mockPostRepository
    );
  });

  describe('createPost', () => {
    it('should create a post successfully', async () => {
      mockPostRepository.save.mockResolvedValue({
        id: 1,
        ...mockRequest.body,
      });

      await createPost(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Post created successfully',
        post: expect.objectContaining({
          id: 1,
          content: 'Test post content',
        }),
      });
    });
  });

  describe('getAllPosts', () => {
    it('should return all posts with author information', async () => {
      const mockAuthor = {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        image: 'profile.jpg',
        email: 'test@example.com',
        password: 'password123',
        genre: 'Fiction',
        role: UserRole.READER,
        savedBooks: [],
      } as User;

      const mockPosts = [
        {
          id: 1,
          title: 'Test Post',
          content: 'Test content',
          imageUrls: ['https://example.com/image.jpg'],
          createdAt: new Date(),
          updatedAt: new Date(),
          author: mockAuthor,
        } as Post,
      ];

      mockPostRepository.find.mockResolvedValue(mockPosts);

      await getAllPosts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            title: 'Test Post',
            author: expect.objectContaining({
              username: 'testuser',
              name: 'Test User',
            }),
          }),
        ])
      );
    });
  });

  describe('getPostsByUserId', () => {
    it('should return posts for a specific user', async () => {
      mockRequest.params = { userId: '1' };

      const mockAuthor = {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        image: 'profile.jpg',
        email: 'test@example.com',
        password: 'password123',
        genre: 'Fiction',
        role: UserRole.READER,
        savedBooks: [],
      } as User;

      const mockUserPosts = [
        {
          id: 1,
          title: 'User Post',
          content: 'User content',
          imageUrls: ['https://example.com/image.jpg'],
          createdAt: new Date(),
          updatedAt: new Date(),
          author: mockAuthor,
        } as Post,
      ];

      mockPostRepository.find.mockResolvedValue(mockUserPosts);

      await getPostsByUserId(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            title: 'User Post',
            author: expect.objectContaining({
              username: 'testuser',
              name: 'Test User',
            }),
          }),
        ])
      );
    });

    it('should handle invalid user ID', async () => {
      mockRequest.params = { userId: 'invalid' };

      await getPostsByUserId(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid user ID',
      });
    });
  });
});
