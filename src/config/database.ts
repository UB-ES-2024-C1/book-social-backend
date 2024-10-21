import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'book_social_user',
  password: 'book_social',
  database: 'book_social_psql',
  synchronize: true,
  logging: true,
  entities: ['src/entities/**/*.ts'],
  subscribers: [],
  migrations: [],
});
