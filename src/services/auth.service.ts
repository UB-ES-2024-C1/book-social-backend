import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validate } from 'class-validator';

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
  // Create user instance
  const user = new User();
  Object.assign(user, {
    firstName,
    lastName,
    username,
    email,
    password,
  });

  // Validate using class-validator
  const errors = await validate(user);
  if (errors.length > 0) {
    const validationErrors = errors
      .map((error) => Object.values(error.constraints || {}))
      .flat();
    return { user: null, error: validationErrors.join(', ') };
  }

  // Check for existing email/username
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

  // Hash password and save user
  user.password = await bcrypt.hash(password, 10);

  try {
    const savedUser = await userRepository.save(user);
    return { user: savedUser };
  } catch (error) {
    return { user: null, error: 'Error saving user to database' };
  }
};
