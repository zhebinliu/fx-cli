import { describe, it, expect } from 'vitest';
import { 
  AppError, 
  FxiaokeApiError, 
  AuthenticationError, 
  ConfigurationError, 
  NetworkError, 
  ValidationError,
  ErrorFactory,
  ErrorCodes
} from './error';

describe('Error Models', () => {
  describe('AppError', () => {
    it('should create base error with message', () => {
      const error = new NetworkError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('NetworkError');
      expect(error.isOperational).toBe(false);
    });

    it('should maintain stack trace', () => {
      const error = new NetworkError('Test error');
      
      expect(error.stack).toBeDefined();
    });
  });

  describe('FxiaokeApiError', () => {
    it('should create Fxiaoke API error', () => {
      const error = new FxiaokeApiError(
        10006,
        'Invalid parameters',
        'Missing required field',
        'trace-123'
      );
      
      expect(error.message).toBe('Fxiaoke API Error (10006): Invalid parameters');
      expect(error.errorCode).toBe(10006);
      expect(error.errorDescription).toBe('Missing required field');
      expect(error.traceId).toBe('trace-123');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it('should identify retryable errors', () => {
      const retryableError = new FxiaokeApiError(10001, 'Rate limit exceeded');
      const nonRetryableError = new FxiaokeApiError(10006, 'Invalid parameters');
      
      expect(retryableError.isRetryable()).toBe(true);
      expect(nonRetryableError.isRetryable()).toBe(false);
    });

    it('should identify HTTP status retryable errors', () => {
      const retryableError = new FxiaokeApiError(500, 'Internal server error');
      const nonRetryableError = new FxiaokeApiError(400, 'Bad request');
      
      expect(retryableError.isRetryable()).toBe(true);
      expect(nonRetryableError.isRetryable()).toBe(false);
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error', () => {
      const error = new AuthenticationError('Invalid token');
      
      expect(error.message).toBe('Invalid token');
      expect(error.errorCode).toBe('AUTH_ERROR');
      expect(error.statusCode).toBe(401);
      expect(error.isOperational).toBe(true);
    });

    it('should create authentication error with custom code', () => {
      const error = new AuthenticationError('Token expired', 'TOKEN_EXPIRED');
      
      expect(error.errorCode).toBe('TOKEN_EXPIRED');
    });
  });

  describe('ConfigurationError', () => {
    it('should create configuration error', () => {
      const error = new ConfigurationError('Missing profile');
      
      expect(error.message).toBe('Missing profile');
      expect(error.errorCode).toBe('CONFIG_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });
  });

  describe('NetworkError', () => {
    it('should create network error', () => {
      const error = new NetworkError('Connection timeout');
      
      expect(error.message).toBe('Connection timeout');
      expect(error.errorCode).toBe('NETWORK_ERROR');
      expect(error.isOperational).toBe(false);
    });

    it('should create network error with status code', () => {
      const error = new NetworkError('Gateway timeout', 504);
      
      expect(error.statusCode).toBe(504);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Invalid input', 'email', 'invalid-email');
      
      expect(error.message).toBe('Invalid input');
      expect(error.errorCode).toBe('VALIDATION_ERROR');
      expect(error.field).toBe('email');
      expect(error.value).toBe('invalid-email');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });
  });

  describe('ErrorFactory', () => {
    it('should create Fxiaoke API error', () => {
      const error = ErrorFactory.fxiaokeApiError(
        10006,
        'Invalid parameters',
        'Missing field',
        'trace-123'
      );
      
      expect(error).toBeInstanceOf(FxiaokeApiError);
      expect(error.errorCode).toBe(10006);
      expect(error.errorDescription).toBe('Missing field');
      expect(error.traceId).toBe('trace-123');
    });

    it('should create authentication error', () => {
      const error = ErrorFactory.authenticationError('Invalid credentials');
      
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('Invalid credentials');
    });

    it('should create configuration error', () => {
      const error = ErrorFactory.configurationError('Missing config');
      
      expect(error).toBeInstanceOf(ConfigurationError);
      expect(error.message).toBe('Missing config');
    });

    it('should create network error', () => {
      const error = ErrorFactory.networkError('Timeout', 408);
      
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.message).toBe('Timeout');
      expect(error.statusCode).toBe(408);
    });

    it('should create validation error', () => {
      const error = ErrorFactory.validationError('Invalid value', 'age', -5);
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid value');
      expect(error.field).toBe('age');
      expect(error.value).toBe(-5);
    });

    it('should handle unknown errors', () => {
      const unknownError = 'Unknown error string';
      const error = ErrorFactory.fromUnknown(unknownError);
      
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.message).toBe('Unknown error string');
    });

    it('should handle Error instances', () => {
      const jsError = new Error('JavaScript error');
      const error = ErrorFactory.fromUnknown(jsError);
      
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.message).toBe('JavaScript error');
    });

    it('should handle AppError instances', () => {
      const appError = new NetworkError('App error');
      const error = ErrorFactory.fromUnknown(appError);
      
      expect(error).toBe(appError); // Should return the same instance
    });
  });

  describe('ErrorCodes', () => {
    it('should have Fxiaoke API error codes', () => {
      expect(ErrorCodes.FXIAOKE_RATE_LIMIT).toBe(10001);
      expect(ErrorCodes.FXIAOKE_SERVICE_UNAVAILABLE).toBe(10002);
      expect(ErrorCodes.FXIAOKE_INTERNAL_ERROR).toBe(10003);
      expect(ErrorCodes.FXIAOKE_INVALID_PARAMS).toBe(10006);
      expect(ErrorCodes.FXIAOKE_AUTH_FAILED).toBe(10007);
    });

    it('should have application error codes', () => {
      expect(ErrorCodes.AUTH_MISSING_CREDENTIALS).toBe('AUTH_MISSING_CREDENTIALS');
      expect(ErrorCodes.AUTH_INVALID_TOKEN).toBe('AUTH_INVALID_TOKEN');
      expect(ErrorCodes.AUTH_TOKEN_EXPIRED).toBe('AUTH_TOKEN_EXPIRED');
      expect(ErrorCodes.CONFIG_MISSING_PROFILE).toBe('CONFIG_MISSING_PROFILE');
      expect(ErrorCodes.VALIDATION_INVALID_INPUT).toBe('VALIDATION_INVALID_INPUT');
      expect(ErrorCodes.NETWORK_TIMEOUT).toBe('NETWORK_TIMEOUT');
    });
  });
});
