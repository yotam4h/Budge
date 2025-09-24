/**
 * Utility function to handle errors in route handlers
 * @param error The error object
 * @param defaultMessage Default message if error has no message property
 * @returns An error message string
 */
export const getErrorMessage = (error: unknown, defaultMessage = 'An error occurred'): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return defaultMessage;
};