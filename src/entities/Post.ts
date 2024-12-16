import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  IsOptional,
  IsString,
  MaxLength,
  ArrayMaxSize,
  IsUrl,
} from 'class-validator';
import { User } from './User';

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @Column('text')
  @IsString()
  @MaxLength(2000)
  content!: string;

  @Column('simple-array', { nullable: true })
  @IsOptional()
  @ArrayMaxSize(4)
  imageUrls?: string[];

  @ManyToOne(() => User, (user) => user.posts)
  author!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
