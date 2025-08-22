import { describe, it, expect } from 'vitest';
import { ResponseFactory, SuccessResponse, ErrorResponse, ApiResponse } from './response';

describe('Response Models', () => {
  describe('SuccessResponse', () => {
    it('should create success response with data', () => {
      const data = { message: 'success' };
      const response = ResponseFactory.success(data, 200);
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.status).toBe(200);
      expect(response.timestamp).toBeDefined();
    });

    it('should use default status 200', () => {
      const response = ResponseFactory.success({ test: true });
      
      expect(response.status).toBe(200);
    });
  });

  describe('ErrorResponse', () => {
    it('should create error response with message', () => {
      const response = ResponseFactory.error('Something went wrong');
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Something went wrong');
      expect(response.timestamp).toBeDefined();
    });

    it('should create error response with error code and message', () => {
      const response = ResponseFactory.error(
        'Validation failed',
        'VALIDATION_ERROR',
        'Field is required'
      );
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Validation failed');
      expect(response.errorCode).toBe('VALIDATION_ERROR');
      expect(response.errorMessage).toBe('Field is required');
    });

    it('should create error response with status code', () => {
      const response = ResponseFactory.error('Not found', 'NOT_FOUND', undefined, 404);
      
      expect(response.success).toBe(false);
      expect(response.status).toBe(404);
    });
  });

  describe('ResponseFactory', () => {
    it('should create error from exception', () => {
      const error = new Error('Test error');
      const response = ResponseFactory.fromException(error);
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Test error');
    });

    it('should create error from exception with status', () => {
      const error = new Error('Test error');
      const response = ResponseFactory.fromException(error, 500);
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Test error');
      expect(response.status).toBe(500);
    });

    it('should create error from HTTP status', () => {
      const response = ResponseFactory.fromHttpStatus(404);
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Not Found');
      expect(response.status).toBe(404);
    });

    it('should create error from HTTP status with custom message', () => {
      const response = ResponseFactory.fromHttpStatus(500, 'Custom server error');
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Custom server error');
      expect(response.status).toBe(500);
    });

    it('should use default message for unknown HTTP status', () => {
      const response = ResponseFactory.fromHttpStatus(999);
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('HTTP Error 999');
      expect(response.status).toBe(999);
    });
  });

  describe('Type guards', () => {
    it('should distinguish between success and error responses', () => {
      const successResponse = ResponseFactory.success({ data: 'test' });
      const errorResponse = ResponseFactory.error('Error message');
      
      if (successResponse.success) {
        expect(successResponse.data).toBeDefined();
      }
      
      if (!errorResponse.success) {
        expect(errorResponse.error).toBeDefined();
      }
    });
  });
});
