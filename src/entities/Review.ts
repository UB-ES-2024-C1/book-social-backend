import 'reflect-metadata';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { IsNotEmpty, IsNumber, Min, Max } from 'class-validator';
import { User } from './User';
import { Book } from './Book';

/**
 * Review entity class
 */
@Entity()
export class Review {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.reviews)
  @IsNotEmpty({ message: 'User is required' })
  user!: User;

  @ManyToOne(() => Book, (book) => book.reviews)
  @IsNotEmpty({ message: 'Book is required' })
  book!: Book;

  @Column({ type: 'decimal', precision: 2, scale: 1 })
  @IsNotEmpty({ message: 'Rating is required' })
  @IsNumber({}, { message: 'Rating must be a number' })
  @Min(0, { message: 'Rating must be at least 0' })
  @Max(5, { message: 'Rating must be at most 5' })
  rating!: number;

  @CreateDateColumn()
  created_at!: Date;
}
