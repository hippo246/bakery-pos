// Centralized Storage Error Handling
// Defines all storage-related error types and handling

/**
 * Storage Error Types
 */
export const ERROR_TYPES = {
  STORAGE_ERROR: 'StorageError',
  AUTHENTICATION_ERROR: 'AuthenticationError',
  PERMISSION_ERROR: 'PermissionError',
  QUOTA_ERROR: 'QuotaError',
  NETWORK_ERROR: 'NetworkError',
  PROVIDER_ERROR: 'ProviderError',
  VALIDATION_ERROR: 'ValidationError',
  OFFLINE_ERROR: 'OfflineError',
  CONNECTION_ERROR: 'ConnectionError',
  FILE_NOT_FOUND_ERROR: 'FileNotFoundError',
  FILE_EXISTS_ERROR: 'FileExistsError',
  INVALID_KEY_ERROR: 'InvalidKeyError',
  SIZE_LIMIT_ERROR: 'SizeLimitError',
  INVALID_CREDENTIALS_ERROR: 'InvalidCredentialsError'
};

/**
 * Base Storage Error
 */
export class StorageError extends Error {
  constructor(message, type = ERROR_TYPES.STORAGE_ERROR, details = {}) {
    super(message);
    this.name = 'StorageError';
    this.type = type;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.userMessage = this.generateUserMessage();
  }

  generateUserMessage() {
    return this.message;
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      userMessage: this.userMessage,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

/**
 * Authentication Error
 */
export class AuthenticationError extends StorageError {
  constructor(message, details = {}) {
    super(message, ERROR_TYPES.AUTHENTICATION_ERROR, details);
    this.name = 'AuthenticationError';
  }

  generateUserMessage() {
    return 'Authentication failed. Please check your credentials.';
  }
}

/**
 * Permission Error
 */
export class PermissionError extends StorageError {
  constructor(message, details = {}) {
    super(message, ERROR_TYPES.PERMISSION_ERROR, details);
    this.name = 'PermissionError';
  }

  generateUserMessage() {
    return 'You do not have permission to perform this action.';
  }
}

/**
 * Quota Error
 */
export class QuotaError extends StorageError {
  constructor(message, details = {}) {
    super(message, ERROR_TYPES.QUOTA_ERROR, details);
    this.name = 'QuotaError';
  }

  generateUserMessage() {
    return 'Storage quota exceeded. Please free up space or upgrade your plan.';
  }
}

/**
 * Network Error
 */
export class NetworkError extends StorageError {
  constructor(message, details = {}) {
    super(message, ERROR_TYPES.NETWORK_ERROR, details);
    this.name = 'NetworkError';
  }

  generateUserMessage() {
    return 'Network error. Please check your connection and try again.';
  }
}

/**
 * Provider Error
 */
export class ProviderError extends StorageError {
  constructor(message, details = {}) {
    super(message, ERROR_TYPES.PROVIDER_ERROR, details);
    this.name = 'ProviderError';
  }

  generateUserMessage() {
    return 'Provider error occurred. Please try again later.';
  }
}

/**
 * Validation Error
 */
export class ValidationError extends StorageError {
  constructor(message, details = {}) {
    super(message, ERROR_TYPES.VALIDATION_ERROR, details);
    this.name = 'ValidationError';
  }

  generateUserMessage() {
    return 'Invalid data provided. Please check your input.';
  }
}

/**
 * Offline Error
 */
export class OfflineError extends StorageError {
  constructor(message, details = {}) {
    super(message, ERROR_TYPES.OFFLINE_ERROR, details);
    this.name = 'OfflineError';
  }

  generateUserMessage() {
    return 'You are offline. Please check your connection.';
  }
}

/**
 * Connection Error
 */
export class ConnectionError extends StorageError {
  constructor(message, details = {}) {
    super(message, ERROR_TYPES.CONNECTION_ERROR, details);
    this.name = 'ConnectionError';
  }

  generateUserMessage() {
    return 'Connection to storage provider failed.';
  }
}

/**
 * File Not Found Error
 */
export class FileNotFoundError extends StorageError {
  constructor(message, details = {}) {
    super(message, ERROR_TYPES.FILE_NOT_FOUND_ERROR, details);
    this.name = 'FileNotFoundError';
  }

  generateUserMessage() {
    return 'File not found.';
  }
}

/**
 * File Exists Error
 */
export class FileExistsError extends StorageError {
  constructor(message, details = {}) {
    super(message, ERROR_TYPES.FILE_EXISTS_ERROR, details);
    this.name = 'FileExistsError';
  }

  generateUserMessage() {
    return 'File already exists.';
  }
}

/**
 * Invalid Key Error
 */
export class InvalidKeyError extends StorageError {
  constructor(message, details = {}) {
    super(message, ERROR_TYPES.INVALID_KEY_ERROR, details);
    this.name = 'InvalidKeyError';
  }

  generateUserMessage() {
    return 'Invalid storage key provided.';
  }
}

/**
 * Size Limit Error
 */
export class SizeLimitError extends StorageError {
  constructor(message, details = {}) {
    super(message, ERROR_TYPES.SIZE_LIMIT_ERROR, details);
    this.name = 'SizeLimitError';
  }

  generateUserMessage() {
    return 'File size exceeds limit.';
  }
}

/**
 * Invalid Credentials Error
 */
export class InvalidCredentialsError extends StorageError {
  constructor(message, details = {}) {
    super(message, ERROR_TYPES.INVALID_CREDENTIALS_ERROR, details);
    this.name = 'InvalidCredentialsError';
  }

  generateUserMessage() {
    return 'Invalid credentials provided.';
  }
}

/**
 * Error Handler
 * Central error handling utility
 */
export class StorageErrorHandler {
  /**
   * Handle error and return user-friendly response
   * @param {Error} error 
   * @returns {object}
   */
  static handle(error) {
    // If already a StorageError, return it
    if (error instanceof StorageError) {
      return {
        success: false,
        error: error.type,
        message: error.message,
        userMessage: error.userMessage,
        details: error.details
      };
    }

    // Convert generic error to StorageError
    const storageError = new StorageError(
      error.message || 'An unknown error occurred',
      ERROR_TYPES.STORAGE_ERROR,
      { originalError: error.name }
    );

    return {
      success: false,
      error: storageError.type,
      message: storageError.message,
      userMessage: storageError.userMessage,
      details: storageError.details
    };
  }

  /**
   * Wrap async function with error handling
   * @param {Function} fn 
   * @returns {Function}
   */
  static wrap(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        return this.handle(error);
      }
    };
  }

  /**
   * Create specific error from provider error
   * @param {object} providerError 
   * @param {string} providerId 
   * @returns {StorageError}
   */
  static fromProviderError(providerError, providerId) {
    const message = providerError.message || 'Provider error occurred';
    const details = { providerId, originalError: providerError };

    // Map provider errors to storage errors
    if (message.includes('auth') || message.includes('credential')) {
      return new AuthenticationError(message, details);
    }

    if (message.includes('permission') || message.includes('access denied')) {
      return new PermissionError(message, details);
    }

    if (message.includes('quota') || message.includes('space')) {
      return new QuotaError(message, details);
    }

    if (message.includes('network') || message.includes('connection')) {
      return new NetworkError(message, details);
    }

    if (message.includes('not found')) {
      return new FileNotFoundError(message, details);
    }

    return new ProviderError(message, details);
  }

  /**
   * Check if error is retryable
   * @param {Error} error 
   * @returns {boolean}
   */
  static isRetryable(error) {
    if (error instanceof NetworkError) return true;
    if (error instanceof ConnectionError) return true;
    if (error instanceof OfflineError) return true;
    if (error instanceof ProviderError) return true;
    return false;
  }

  /**
   * Check if error is user-facing
   * @param {Error} error 
   * @returns {boolean}
   */
  static isUserFacing(error) {
    return error instanceof StorageError;
  }
}

export default StorageErrorHandler;
