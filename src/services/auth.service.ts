import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validate } from 'class-validator';

const userRepository = AppDataSource.getRepository(User);

/**
 * Logs in a user and returns a JWT token if credentials are valid.
 *
 * @param email The email of the user.
 * @param password The password of the user.
 * @returns A Promise that resolves to a JWT token if the user is found and the password is valid, otherwise null.
 */
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

/**
 * Registers a new user and saves them to the database.
 *
 * @param firstName The first name of the user.
 * @param lastName The last name of the user.
 * @param username The username of the user.
 * @param email The email of the user.
 * @param password The password of the user.
 * @returns A Promise that resolves to an object containing the user if registration is successful, otherwise an error message.
 */
export const registerUser = async (
  firstName: string,
  lastName: string,
  username: string,
  email: string,
  password: string,
  role: UserRole = UserRole.READER
): Promise<{ user: User | null; error?: string }> => {
  const user = new User();
  Object.assign(user, {
    firstName,
    lastName,
    username,
    email,
    password,
    role,
  });

  const errors = await validate(user);
  if (errors.length > 0) {
    const validationErrors = errors
      .map((error) => Object.values(error.constraints || {}))
      .flat();
    return { user: null, error: validationErrors.join(', ') };
  }

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

  user.password = await bcrypt.hash(password, 10);

  try {
    const savedUser = await userRepository.save(user);
    return { user: savedUser };
  } catch (error) {
    console.error('Error saving user to database:', error);
    return { user: null, error: 'Error saving user to database' };
  }
};
