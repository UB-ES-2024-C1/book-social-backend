import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userRepository = AppDataSource.getRepository(User);

export const loginUser = async (
  email: string,
  password: string
): Promise<string | null> => {
  const user = await userRepository.findOne({ where: { email } });
  if (!user) return null;

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) return null;

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
    expiresIn: '1h',
  });
  return token;
};

export const registerUser = async (
  firstName: string,
  lastName: string,
  username: string,
  email: string,
  password: string
): Promise<{ user: User | null; error?: string }> => {
  const existingEmail = await userRepository.findOne({
    where: { email },
  });
  if (existingEmail) {
    return { user: null, error: 'Email already exists' };
  }

  const existingUsername = await userRepository.findOne({
    where: { username },
  });
  if (existingUsername) {
    return { user: null, error: 'Username already exists' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = userRepository.create({
    firstName,
    lastName,
    username,
    email,
    password: hashedPassword,
  });

  await userRepository.save(newUser);

  return { user: newUser };
};
