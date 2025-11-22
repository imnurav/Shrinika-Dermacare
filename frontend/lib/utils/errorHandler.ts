import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

export function handleApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    const response = error.response;
    
    if (response) {
      // Handle validation errors
      if (response.status === 400 && response.data?.message) {
        if (Array.isArray(response.data.message)) {
          return response.data.message.join(', ');
        }
        return response.data.message;
      }

      // Handle specific error messages
      if (response.data?.message) {
        return response.data.message;
      }

      // Handle status code messages
      switch (response.status) {
        case 401:
          return 'Unauthorized. Please login again.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'Resource not found.';
        case 409:
          return 'This resource already exists.';
        case 422:
          return 'Validation failed. Please check your input.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return `Error: ${response.status} - ${response.statusText}`;
      }
    }

    // Network error
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.';
    }

    if (error.message === 'Network Error') {
      return 'Network error. Please check your connection.';
    }
  }

  // Unknown error
  if (error instanceof Error) {
    return error.message || 'An unexpected error occurred';
  }

  return 'An unexpected error occurred. Please try again.';
}

export function getErrorMessage(error: unknown): string {
  return handleApiError(error);
}

