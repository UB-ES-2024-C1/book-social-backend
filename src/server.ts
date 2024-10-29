import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import 'reflect-metadata';

const port = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost';

app.listen(port, () => {
  console.log(`Server is running on ${host}:${port}`);
});
