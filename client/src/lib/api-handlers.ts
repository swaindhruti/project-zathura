import { toast } from 'sonner';
import { AxiosError, AxiosResponse } from 'axios';

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data: T | null;
  message?: string;
  statusCode?: number;
}

/**
 * Handles successful API responses with consistent formatting
 */
export const handleSuccess = <T>(
  response: AxiosResponse<any>,
  successMessage?: string,
  showToast: boolean = true
): ApiResponse<T> => {
  const message = successMessage || response.data.message || 'Request successful';

  if (showToast) toast.success(message);

  return {
    status: 'success',
    data: response.data,
    message,
    statusCode: response.status,
  };
};

/**
 * Handles API errors with consistent formatting
 */
export const handleError = (
  error: unknown,
  fallbackMessage: string = 'Request failed',
  showToast: boolean = true
): ApiResponse<null> => {
  console.error('API error:', error);

  let errorMessage = fallbackMessage;
  let statusCode = 500;

  if (error instanceof AxiosError) {
    statusCode = error.response?.status || 500;

    const responseData = error.response?.data;

    if (responseData) {
      if (typeof responseData.message === 'string') {
        const message = responseData.message;

        if (message.includes('Unique constraint failed on the fields')) {
          const fieldMatch = message.match(/\(`([^`]+)`\)/);
          const field = fieldMatch ? fieldMatch[1] : 'field';
          errorMessage = `This ${field} is already in use. Please try another one.`;
        } else if (message.includes('Foreign key constraint failed')) {
          errorMessage = 'Referenced record does not exist';
        } else if (message.includes('Record to update not found')) {
          errorMessage = 'The record you are trying to update does not exist';
        } else {
          errorMessage = message;
        }
      } else {
        errorMessage =
          responseData.message ||
          responseData.error ||
          responseData.errorMessage ||
          error.message ||
          fallbackMessage;
      }
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  if (showToast) toast.error(errorMessage);

  return {
    status: 'error',
    data: null,
    message: errorMessage,
    statusCode,
  };
};
