import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Post } from '../entities/Post';
import { validate } from 'class-validator';

export const createPost = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { title, content, imageUrls } = req.body;

    const post = new Post();
    post.title = title;
    post.content = content;
    post.imageUrls = imageUrls;
    post.author = req.user;

    // Validate post
    const errors = await validate(post);
    if (errors.length > 0) {
      res.status(400).json({ message: 'Validation failed', errors });
      return;
    }

    const postRepository = AppDataSource.getRepository(Post);
    const savedPost = await postRepository.save(post);

    res.status(201).json({
      message: 'Post created successfully',
      post: savedPost,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating post',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getUserPosts = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId || req.user?.id;

    const postRepository = AppDataSource.getRepository(Post);
    const posts = await postRepository.find({
      where: { author: { id: Number(userId) } },
      order: { createdAt: 'DESC' },
    });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching posts',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const postRepository = AppDataSource.getRepository(Post);
    const posts = await postRepository.find({
      relations: ['author'],
      order: { createdAt: 'DESC' },
      select: {
        author: {
          id: true,
          username: true,
          image: true,
          firstName: true,
          lastName: true,
        },
      },
    });

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      imageUrls: post.imageUrls,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        id: post.author.id,
        username: post.author.username,
        image: post.author.image || '',
        name: `${post.author.firstName} ${post.author.lastName}`,
      },
    }));

    res.status(200).json(formattedPosts);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching posts',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getPostsByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId || isNaN(Number(userId))) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    const postRepository = AppDataSource.getRepository(Post);
    const posts = await postRepository.find({
      where: { author: { id: Number(userId) } },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      select: {
        author: {
          id: true,
          username: true,
          image: true,
          firstName: true,
          lastName: true,
        },
      },
    });

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      imageUrls: post.imageUrls,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        id: post.author.id,
        username: post.author.username,
        image: post.author.image || '',
        name: `${post.author.firstName} ${post.author.lastName}`,
      },
    }));

    res.status(200).json(formattedPosts);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching user posts',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
