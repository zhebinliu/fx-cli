/**
 * Base error class for application errors
 */
export abstract class AppError extends Error {
  public readonly errorCode: string | number;
  public readonly statusCode?: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    errorCode: string | number = 'UNKNOWN_ERROR',
    statusCode?: number,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Fxiaoke API specific errors
 */
export class FxiaokeApiError extends AppError {
  public readonly errorDescription?: string;
  public readonly traceId?: string;

  constructor(
    errorCode: number,
    errorMessage: string,
    errorDescription?: string,
    traceId?: string
  ) {
    super(
      `Fxiaoke API Error (${errorCode}): ${errorMessage}`,
      errorCode,
      400, // Most API errors are client errors
      true
    );
    this.errorDescription = errorDescription;
    this.traceId = traceId;
  }

  /**
   * Check if this is a retryable error
   */
  isRetryable(): boolean {
    // Common retryable error codes for Fxiaoke API
    const retryableCodes = [
      10001, // Rate limit exceeded
      10002, // Service temporarily unavailable
      10003, // Internal server error
      500,   // HTTP 500
      502,   // Bad Gateway
      503,   // Service Unavailable
      504    // Gateway Timeout
    ];
    return retryableCodes.includes(Number(this.errorCode));
  }
}

/**
 * Authentication errors
 */
export class AuthenticationError extends AppError {
  constructor(message: string, errorCode: string | number = 'AUTH_ERROR') {
    super(message, errorCode, 401, true);
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends AppError {
  constructor(message: string, errorCode: string | number = 'CONFIG_ERROR') {
    super(message, errorCode, 400, true);
  }
}

/**
 * Network/HTTP errors
 */
export class NetworkError extends AppError {
  constructor(message: string, statusCode?: number) {
    super(message, 'NETWORK_ERROR', statusCode, false);
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  public readonly field?: string;
  public readonly value?: any;

  constructor(message: string, field?: string, value?: any) {
    super(message, 'VALIDATION_ERROR', 400, true);
    this.field = field;
    this.value = value;
  }
}

/**
 * Error factory for creating common error types
 */
export class ErrorFactory {
  /**
   * Create a Fxiaoke API error from response data
   */
  static fxiaokeApiError(
    errorCode: number,
    errorMessage: string,
    errorDescription?: string,
    traceId?: string
  ): FxiaokeApiError {
    return new FxiaokeApiError(errorCode, errorMessage, errorDescription, traceId);
  }

  /**
   * Create an authentication error
   */
  static authenticationError(message: string, errorCode?: string | number): AuthenticationError {
    return new AuthenticationError(message, errorCode);
  }

  /**
   * Create a configuration error
   */
  static configurationError(message: string, errorCode?: string | number): ConfigurationError {
    return new ConfigurationError(message, errorCode);
  }

  /**
   * Create a network error
   */
  static networkError(message: string, statusCode?: number): NetworkError {
    return new NetworkError(message, statusCode);
  }

  /**
   * Create a validation error
   */
  static validationError(message: string, field?: string, value?: any): ValidationError {
    return new ValidationError(message, field, value);
  }

  /**
   * Create error from unknown error object
   */
  static fromUnknown(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new NetworkError(error.message);
    }

    return new NetworkError(String(error));
  }
}

/**
 * Error codes constants
 */
export const ErrorCodes = {
  // Fxiaoke API Errors
  FXIAOKE_RATE_LIMIT: 10001,
  FXIAOKE_SERVICE_UNAVAILABLE: 10002,
  FXIAOKE_INTERNAL_ERROR: 10003,
  FXIAOKE_INVALID_PARAMS: 10006,
  FXIAOKE_AUTH_FAILED: 10007,

  // Application Errors
  AUTH_MISSING_CREDENTIALS: 'AUTH_MISSING_CREDENTIALS',
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  CONFIG_MISSING_PROFILE: 'CONFIG_MISSING_PROFILE',
  CONFIG_INVALID_VALUE: 'CONFIG_INVALID_VALUE',
  VALIDATION_INVALID_INPUT: 'VALIDATION_INVALID_INPUT',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_CONNECTION_FAILED: 'NETWORK_CONNECTION_FAILED'
} as const;
