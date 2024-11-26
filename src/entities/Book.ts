import 'reflect-metadata';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import {
  Length,
  IsNotEmpty,
  IsUrl,
  IsDate,
  IsInt,
  Min,
  IsNumber,
  Max,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ArrayNotEmpty,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { User } from './User';
import { Review } from './Review';

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
  @Type(() => Date)
  publication_date!: Date;

  @Column('text', { array: true })
  @IsArray({ message: 'Genre must be an array of strings' })
  @ArrayNotEmpty({ message: 'Genre must contain at least one genre' })
  @ArrayMinSize(1, { message: 'Genre must contain at least one item' })
  @ArrayMaxSize(10, { message: 'Genre cannot contain more than 10 items' })
  genres!: string[];

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

  @Column({ type: 'float', nullable: true })
  @Min(0, { message: 'Review value must be at least 0' })
  @IsNumber({}, { message: 'Review value must be a number' })
  @Max(5, { message: 'Review value must be at most 5' })
  reviewValue?: number;

  @OneToMany(() => Review, (review) => review.book)
  reviews?: Review[];

  @Column({ nullable: true })
  @Length(10, 13, { message: 'ISBN must be 10 or 13 characters long.' })
  @Matches(/^\d+$/, { message: 'ISBN must contain only numbers.' })
  ISBN?: string;

  @Column({ nullable: true })
  @Length(10, 10, { message: 'ASIN must be exactly 10 characters long.' })
  ASIN?: string;
}
