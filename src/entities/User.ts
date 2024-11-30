import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import {
  IsEmail,
  Length,
  Matches,
  MinLength,
  MaxLength,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { Book } from './Book';
import { Review } from './Review';

/**
 * User entity class
 */
export enum UserRole {
  READER = 'reader',
  WRITER = 'writer',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @IsNotEmpty({ message: 'First name is required' })
  @Length(1, 50, {
    message: 'First name must be between 1 and 50 characters',
  })
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message:
      'First name can only contain letters, spaces, hyphens and apostrophes',
  })
  firstName!: string;

  @Column()
  @IsNotEmpty({ message: 'Last name is required' })
  @Length(1, 50, {
    message: 'Last name must be between 1 and 50 characters',
  })
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message:
      'Last name can only contain letters, spaces, hyphens and apostrophes',
  })
  lastName!: string;

  @Column()
  @IsNotEmpty({ message: 'Literary genre is required' })
  @Length(1, 50, {
    message: 'Literary genre must be between 1 and 50 characters',
  })
  genre!: string;

  @Column({ type: 'text', nullable: true })
  @Length(0, 1000, {
    message: 'Description must be less than 1000 characters',
  })
  description?: string;

  @Column({ unique: true })
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(3, {
    message: 'Username must be at least 3 characters long',
  })
  @MaxLength(30, {
    message: 'Username must be less than 30 characters',
  })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Username can only contain letters, numbers, underscores and dashes',
  })
  username!: string;

  @Column({ unique: true })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail(
    {},
    {
      message: 'Invalid email format',
    }
  )
  @MaxLength(255, {
    message: 'Email must be less than 255 characters',
  })
  email!: string;

  @Column()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, {
    message: 'Password must be at least 8 characters long',
  })
  @MaxLength(100, {
    message: 'Password must be less than 100 characters',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*(_|[^\w])).{8,}$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  password!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.READER,
  })
  @IsNotEmpty({ message: 'Role is required' })
  @IsEnum(UserRole, {
    message: 'Invalid role. Must be either reader or writer',
  })
  role!: UserRole;

  @OneToMany(() => Book, (book) => book.author)
  books?: Book[];

  @OneToMany(() => Review, (review) => review.user)
  reviews?: Review[];
}
