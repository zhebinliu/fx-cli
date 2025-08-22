import { describe, it, expect } from 'vitest';
import { FxiaokeResponseParser } from './parser';
import { FxiaokeApiResponse, FxiaokeAuthData } from './response';
import { FxiaokeApiError } from './error';

describe('FxiaokeResponseParser', () => {
  describe('parse', () => {
    it('should parse Fxiaoke API success response', () => {
      const fxiaokeResponse: FxiaokeApiResponse = {
        errorCode: 0,
        errorMessage: 'success',
        data: { result: 'test' }
      };
      
      const result = FxiaokeResponseParser.parse(fxiaokeResponse);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ result: 'test' });
        expect(result.status).toBe(200);
      }
    });

    it('should parse Fxiaoke API error response', () => {
      const fxiaokeResponse: FxiaokeApiResponse = {
        errorCode: 10006,
        errorMessage: 'Invalid parameters',
        errorDescription: 'Missing required field'
      };
      
      const result = FxiaokeResponseParser.parse(fxiaokeResponse);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Fxiaoke API Error (10006): Invalid parameters');
        expect(result.errorCode).toBe(10006);
        expect(result.errorMessage).toBe('Invalid parameters');
      }
    });

    it('should parse non-Fxiaoke response as success', () => {
      const genericResponse = { message: 'Hello', status: 'ok' };
      
      const result = FxiaokeResponseParser.parse(genericResponse);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(genericResponse);
        expect(result.status).toBe(200);
      }
    });

    it('should handle null response gracefully', () => {
      const invalidResponse = null;
      
      const result = FxiaokeResponseParser.parse(invalidResponse);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe('parseAuthResponse', () => {
    it('should parse successful authentication response', () => {
      const authResponse: FxiaokeApiResponse<FxiaokeAuthData> = {
        errorCode: 0,
        errorMessage: 'success',
        corpAccessToken: 'token-123',
        corpId: 'corp-456',
        expiresIn: 7200
      };
      
      const result = FxiaokeResponseParser.parseAuthResponse(authResponse);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.corpAccessToken).toBe('token-123');
        expect(result.data.corpId).toBe('corp-456');
        expect(result.data.expiresIn).toBe(7200);
      }
    });

    it('should parse authentication error response', () => {
      const authResponse: FxiaokeApiResponse = {
        errorCode: 10007,
        errorMessage: 'Authentication failed',
        errorDescription: 'Invalid credentials'
      };
      
      const result = FxiaokeResponseParser.parseAuthResponse(authResponse);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Fxiaoke API Error (10007): Authentication failed');
        expect(result.errorCode).toBe(10007);
        expect(result.errorMessage).toBe('Authentication failed');
      }
    });

    it('should reject non-Fxiaoke format responses', () => {
      const genericResponse = { message: 'Hello' };
      
      const result = FxiaokeResponseParser.parseAuthResponse(genericResponse);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Response is not in Fxiaoke API format');
      }
    });

    it('should reject responses missing required auth fields', () => {
      const incompleteResponse: FxiaokeApiResponse = {
        errorCode: 0,
        errorMessage: 'success',
        // Missing corpAccessToken and corpId
        expiresIn: 7200
      };
      
      const result = FxiaokeResponseParser.parseAuthResponse(incompleteResponse);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Authentication response missing required fields (corpAccessToken, corpId)');
      }
    });

    it('should handle null authentication response gracefully', () => {
      const invalidResponse = null;
      
      const result = FxiaokeResponseParser.parseAuthResponse(invalidResponse);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Response is not in Fxiaoke API format');
      }
    });
  });

  describe('createErrorFromResponse', () => {
    it('should create FxiaokeApiError from response', () => {
      const fxiaokeResponse: FxiaokeApiResponse = {
        errorCode: 10006,
        errorMessage: 'Invalid parameters',
        errorDescription: 'Missing field',
        traceId: 'trace-123'
      };
      
      const error = FxiaokeResponseParser.createErrorFromResponse(fxiaokeResponse);
      
      expect(error).toBeInstanceOf(FxiaokeApiError);
      expect(error.errorCode).toBe(10006);
      expect(error.message).toBe('Fxiaoke API Error (10006): Invalid parameters');
      expect(error.errorDescription).toBe('Missing field');
      expect(error.traceId).toBe('trace-123');
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable errors', () => {
      const retryableResponse: FxiaokeApiResponse = {
        errorCode: 10001,
        errorMessage: 'Rate limit exceeded'
      };
      
      const nonRetryableResponse: FxiaokeApiResponse = {
        errorCode: 10006,
        errorMessage: 'Invalid parameters'
      };
      
      expect(FxiaokeResponseParser.isRetryableError(retryableResponse)).toBe(true);
      expect(FxiaokeResponseParser.isRetryableError(nonRetryableResponse)).toBe(false);
    });

    it('should not retry successful responses', () => {
      const successResponse: FxiaokeApiResponse = {
        errorCode: 0,
        errorMessage: 'success'
      };
      
      expect(FxiaokeResponseParser.isRetryableError(successResponse)).toBe(false);
    });
  });

  describe('extractErrorInfo', () => {
    it('should extract error information for logging', () => {
      const fxiaokeResponse: FxiaokeApiResponse = {
        errorCode: 10002,
        errorMessage: 'Service unavailable',
        errorDescription: 'Temporary outage',
        traceId: 'trace-456'
      };
      
      const errorInfo = FxiaokeResponseParser.extractErrorInfo(fxiaokeResponse);
      
      expect(errorInfo.errorCode).toBe(10002);
      expect(errorInfo.errorMessage).toBe('Service unavailable');
      expect(errorInfo.errorDescription).toBe('Temporary outage');
      expect(errorInfo.traceId).toBe('trace-456');
      expect(errorInfo.isRetryable).toBe(true);
    });
  });
});
