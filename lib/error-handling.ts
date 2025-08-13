import { toast } from 'sonner';

/**
 * Standard error types for the application
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK = 'NETWORK',
  CONVEX = 'CONVEX',
}

/**
 * Application error class with structured error handling
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    type: ErrorType = ErrorType.SERVER_ERROR,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    // Ensure the stack trace points to where the error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error for form and input validation
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.VALIDATION, 400, true, details);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error for login/auth issues
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, ErrorType.AUTHENTICATION, 401, true);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error for permission issues
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, ErrorType.AUTHORIZATION, 403, true);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, ErrorType.NOT_FOUND, 404, true);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error for duplicate or conflicting resources
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, ErrorType.CONFLICT, 409, true);
    this.name = 'ConflictError';
  }
}

/**
 * Error handling utilities
 */
export class ErrorHandler {
  /**
   * Handle Convex errors with user-friendly messages
   */
  static handleConvexError(error: any): AppError {
    // Check if it's already our custom error
    if (error instanceof AppError) {
      return error;
    }

    // Handle Convex-specific errors
    if (error?.code === 'UNAUTHENTICATED') {
      return new AuthenticationError('Please sign in to continue');
    }

    if (error?.code === 'UNAUTHORIZED') {
      return new AuthorizationError('You don\'t have permission to perform this action');
    }

    if (error?.code === 'INVALID_REQUEST') {
      return new ValidationError(error.message || 'Invalid request data', error.data);
    }

    if (error?.code === 'NOT_FOUND') {
      return new NotFoundError(error.message || 'Resource not found');
    }

    // Network/connection errors
    if (error?.name === 'NetworkError' || error?.code === 'NETWORK_ERROR') {
      return new AppError(
        'Connection error. Please check your internet connection and try again.',
        ErrorType.NETWORK,
        0,
        true
      );
    }

    // Default to server error for unknown errors
    return new AppError(
      error?.message || 'An unexpected error occurred',
      ErrorType.CONVEX,
      500,
      true,
      error
    );
  }

  /**
   * Display error to user with toast notification
   */
  static showError(error: Error | AppError | string, context?: string): void {
    let message: string;
    let description: string | undefined;

    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof AppError) {
      message = error.message;
      if (context) {
        description = `Context: ${context}`;
      }
    } else {
      message = error.message || 'An unexpected error occurred';
      if (process.env.NODE_ENV === 'development') {
        description = error.stack;
      }
    }

    toast.error(message, {
      description,
      duration: 5000,
    });
  }

  /**
   * Log error for debugging and monitoring
   */
  static logError(error: Error | AppError, context?: string): void {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorDetails);
    }

    // In production, you would send this to your error tracking service
    if (process.env.NODE_ENV === 'production') {
      try {
        // Example: Send to error tracking service
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'exception', {
            description: error.message,
            fatal: false,
          });
        }
      } catch (reportingError) {
        console.error('Failed to log error:', reportingError);
      }
    }
  }

  /**
   * Handle async operations with error catching
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: string,
    showToast: boolean = true
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      const handledError = this.handleConvexError(error);
      this.logError(handledError, context);
      
      if (showToast) {
        this.showError(handledError, context);
      }
      
      return null;
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    context?: string
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain error types
        if (error instanceof ValidationError || 
            error instanceof AuthenticationError || 
            error instanceof AuthorizationError) {
          throw error;
        }

        if (attempt === maxRetries - 1) {
          break;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // If we get here, all retries failed
    const handledError = this.handleConvexError(lastError!);
    this.logError(handledError, context);
    throw handledError;
  }
}

/**
 * React hook for error handling
 */
export function useErrorHandler() {
  const handleError = (error: Error | string, context?: string, showToast: boolean = true) => {
    const handledError = typeof error === 'string' 
      ? new AppError(error) 
      : ErrorHandler.handleConvexError(error);
    
    ErrorHandler.logError(handledError, context);
    
    if (showToast) {
      ErrorHandler.showError(handledError, context);
    }
    
    return handledError;
  };

  const handleAsyncError = async <T>(
    operation: () => Promise<T>,
    context?: string,
    showToast: boolean = true
  ): Promise<T | null> => {
    return ErrorHandler.withErrorHandling(operation, context, showToast);
  };

  const handleWithRetry = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    context?: string
  ): Promise<T> => {
    return ErrorHandler.withRetry(operation, maxRetries, 1000, context);
  };

  return {
    handleError,
    handleAsyncError,
    handleWithRetry,
  };
}

/**
 * Higher-order function to wrap functions with error handling
 */
export function withErrorHandling<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => TReturn | Promise<TReturn>,
  context?: string
) {
  return async (...args: TArgs): Promise<TReturn | null> => {
    try {
      const result = await fn(...args);
      return result;
    } catch (error) {
      const handledError = ErrorHandler.handleConvexError(error);
      ErrorHandler.logError(handledError, context);
      ErrorHandler.showError(handledError, context);
      return null;
    }
  };
}

export default ErrorHandler;