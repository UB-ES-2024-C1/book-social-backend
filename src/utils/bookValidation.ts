import { Book } from '../entities/Book';

export const validateBookInput = (
  bookData: Partial<Book>
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // Validar que bookData existe
  if (!bookData) {
    return {
      isValid: false,
      errors: ['Book data is required'],
    };
  }

  // Validar campos requeridos y formato
  if (!bookData.title?.trim()) {
    errors.push('Title is required');
  } else if (
    bookData.title.trim().length === 0 ||
    bookData.title.length > 255
  ) {
    errors.push('Title must be between 1 and 255 characters');
  }

  if (!bookData.author) {
    errors.push('Author is required');
  }

  if (!bookData.genres) {
    errors.push('Genre is required');
  } else if (bookData.genres.length === 0) {
    errors.push('At least one genre is required');
  }

  // Validación de fecha
  if (!bookData.publication_date) {
    errors.push('Publication date is required');
  } else {
    const date = new Date(bookData.publication_date);
    if (isNaN(date.getTime())) {
      errors.push('Publication date must be a valid date');
    }
  }

  // Validar números
  if (bookData.num_pages !== undefined && bookData.num_pages < 1) {
    errors.push('Number of pages must be at least 1');
  }

  if (
    bookData.reviewValue !== undefined &&
    (bookData.reviewValue < 0 || bookData.reviewValue > 5)
  ) {
    errors.push('Review value must be between 0 and 5');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
