import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import {
  Length,
  IsNotEmpty,
  IsUrl,
  IsDate,
  IsInt,
  Min,
  IsNumber,
  Max,
} from 'class-validator';
import { User } from './User';

/**
 * Book entity class
 */
@Entity()
export class Book {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @IsNotEmpty({ message: 'Title is required' })
  @Length(1, 255, {
    message: 'Title must be between 1 and 255 characters',
  })
  title!: string;

  @ManyToOne(() => User, (user) => user.books)
  author!: User;

  @Column({ type: 'date' })
  @IsDate({ message: 'Publication date must be a valid date' })
  publication_date!: Date;

  @Column({ length: 100 })
  @Length(1, 100, { message: 'Genre must be up to 100 characters' })
  genre!: string;

  @Column('text', { nullable: true })
  synopsis?: string;

  @Column({ nullable: true })
  @IsUrl({}, { message: 'Image URL must be a valid URL' })
  image_url?: string;

  @Column({ nullable: true })
  @IsInt({ message: 'Number of pages must be an integer' })
  @Min(1, { message: 'Number of pages must be at least 1' })
  num_pages?: number;

  @Column({ length: 255, nullable: true })
  @Length(0, 255, { message: 'Publisher must be up to 255 characters' })
  publisher?: string;

  @Column({ nullable: true })
  @Min(0, { message: 'Review value must be at least 0' })
  @IsNumber({}, { message: 'Review value must be a number' })
  @Max(5, { message: 'Review value must be at most 5' })
  reviewValue?: number;
}