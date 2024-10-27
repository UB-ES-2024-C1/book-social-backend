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
