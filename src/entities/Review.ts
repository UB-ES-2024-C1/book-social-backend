import 'reflect-metadata';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import {
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsDate,
  IsString,
  MaxLength,
} from 'class-validator';
import { User } from './User';
import { Book } from './Book';

/**
 * Review entity class
 */
@Entity()
export class Review {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { nullable: false })
  @IsNotEmpty({ message: 'User is required' })
  user!: User;

  @ManyToOne(() => Book, { nullable: false })
  @IsNotEmpty({ message: 'Book is required' })
  book!: Book;

  @Column('float')
  @IsNotEmpty({ message: 'Rating is required' })
  @IsNumber({}, { message: 'Rating must be a number' })
  @Min(0, { message: 'Rating must be at least 0' })
  @Max(5, { message: 'Rating must be at most 5' })
  rating!: number;

  @Column('text', { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Comment must be shorter than 1000 characters' })
  comment?: string;

  @CreateDateColumn()
  @IsDate({ message: 'Created date must be a valid date' })
  created_at!: Date;
}
