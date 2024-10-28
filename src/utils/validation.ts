/**
 * Validates the input for login.
 * @param {string} email - The email to be validated.
 * @param {string} password - The password to be validated.
 * @returns {{isValid: boolean; errors: string[]}} - An object containing a boolean indicating if the input is valid and an array of error messages.
 */
export const validateLoginInput = (
  email: string,
  password: string
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!email) errors.push('Email is required');
  if (!password) errors.push('Password is required');

  const emailError = validateUserEmail(email);
  const passwordError = validateUserPassword(password);

  if (emailError) errors.push(emailError);
  if (passwordError) errors.push(passwordError);

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates the input for registration.
 * @param {string} firstName - The first name to be validated.
 * @param {string} lastName - The last name to be validated.
 * @param {string} username - The username to be validated.
 * @param {string} email - The email to be validated.
 * @param {string} password - The password to be validated.
 * @returns {{isValid: boolean; errors: string[]}} - An object containing a boolean indicating if the input is valid and an array of error messages.
 */
export const validateRegisterInput = (
  firstName: string,
  lastName: string,
  username: string,
  email: string,
  password: string
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // Required fields
  if (!firstName?.trim()) errors.push('First name is required');
  if (!lastName?.trim()) errors.push('Last name is required');
  if (!username?.trim()) errors.push('Username is required');
  if (!email?.trim()) errors.push('Email is required');
  if (!password?.trim()) errors.push('Password is required');

  // Length validations
  if (firstName?.length > 50)
    errors.push('First name must be less than 50 characters');
  if (lastName?.length > 50)
    errors.push('Last name must be less than 50 characters');
  if (username?.length < 3)
    errors.push('Username must be at least 3 characters long');
  if (username?.length > 30)
    errors.push('Username must be less than 30 characters');

  // Format validations
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (username && !usernameRegex.test(username)) {
    errors.push(
      'Username can only contain letters, numbers, underscores and dashes'
    );
  }

  const emailError = validateUserEmail(email);
  const passwordError = validateUserPassword(password);

  if (emailError) errors.push(emailError);
  if (passwordError) errors.push(passwordError);

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates the format of an email.
 * @param {string} email - The email to be validated.
 * @returns {string | null} - Returns an error message if the email is invalid, otherwise returns null.
 */
export const validateUserEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }
  return null;
};
/**
 * Validates the format of a password.
 * @param {string} password - The password to be validated.
 * @returns {string | null} - Returns an error message if the password is invalid, otherwise returns null.
 */
export const validateUserPassword = (password: string): string | null => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*(_|[^\w])).{8,}$/;
  if (!passwordRegex.test(password)) {
    return 'Password must be at least 8 characters long, contain uppercase and lowercase letters, numbers, and special characters';
  }
  return null;
};
