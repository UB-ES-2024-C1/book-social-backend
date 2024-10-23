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
): Promise<User | null> => {
  // Verificar si el usuario ya existe
  const existingUser = await userRepository.findOne({
    where: [{ email }, { username }],
  });
  if (existingUser) return null;

  // Crear nuevo usuario
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = userRepository.create({
    firstName,
    lastName,
    username,
    email,
    password: hashedPassword,
  });

  // Guardar el nuevo usuario en la base de datos
  await userRepository.save(newUser);

  return newUser;
};
