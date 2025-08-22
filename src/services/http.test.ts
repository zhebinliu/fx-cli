import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HttpClient, httpClient } from './http';
import { ConfigManager } from '../config/manager';

// Mock the config manager
vi.mock('../config/manager');

describe('HttpClient', () => {
  let httpClientInstance: HttpClient;
  let mockConfigManager: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock config manager
    mockConfigManager = {
      getCurrentProfile: vi.fn().mockReturnValue({
        baseUrl: 'https://test.example.com',
        timeout: 15000
      })
    };
    
    // Mock the ConfigManager constructor
    vi.mocked(ConfigManager).mockImplementation(() => mockConfigManager);
    
    // Create new instance for each test
    httpClientInstance = new HttpClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create axios instance and setup interceptors', () => {
      expect(httpClientInstance).toBeInstanceOf(HttpClient);
    });
  });

  describe('get', () => {
    it('should make successful GET request', async () => {
      const mockResponse = { data: { message: 'success' }, status: 200 };
      const mockAxiosInstance = {
        get: vi.fn().mockResolvedValue(mockResponse)
      };
      
      // Mock the private axiosInstance
      (httpClientInstance as any).axiosInstance = mockAxiosInstance;
      
      const result = await httpClientInstance.get('/test');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockResponse.data);
        expect(result.status).toBe(200);
      }
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test');
    });

    it('should handle GET request error', async () => {
      const mockAxiosInstance = {
        get: vi.fn().mockRejectedValue({
          isAxiosError: true,
          message: 'Network error'
        })
      };
      
      (httpClientInstance as any).axiosInstance = mockAxiosInstance;
      
      const result = await httpClientInstance.get('/test');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Request error');
      }
    });
  });

  describe('post', () => {
    it('should make successful POST request', async () => {
      const mockResponse = { data: { id: 123 }, status: 201 };
      const mockAxiosInstance = {
        post: vi.fn().mockResolvedValue(mockResponse)
      };
      
      (httpClientInstance as any).axiosInstance = mockAxiosInstance;
      
      const postData = { name: 'test' };
      const result = await httpClientInstance.post('/test', postData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ id: 123 });
        expect(result.status).toBe(201);
      }
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', postData);
    });

    it('should handle POST request error', async () => {
      const mockAxiosInstance = {
        post: vi.fn().mockRejectedValue({
          isAxiosError: true,
          message: 'Validation error'
        })
      };
      
      (httpClientInstance as any).axiosInstance = mockAxiosInstance;
      
      const result = await httpClientInstance.post('/test', {});
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Request error');
      }
    });
  });

  describe('put', () => {
    it('should make successful PUT request', async () => {
      const mockResponse = { data: { updated: true }, status: 200 };
      const mockAxiosInstance = {
        put: vi.fn().mockResolvedValue(mockResponse)
      };
      
      (httpClientInstance as any).axiosInstance = mockAxiosInstance;
      
      const putData = { name: 'updated' };
      const result = await httpClientInstance.put('/test/123', putData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ updated: true });
        expect(result.status).toBe(200);
      }
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test/123', putData);
    });
  });

  describe('delete', () => {
    it('should make successful DELETE request', async () => {
      const mockResponse = { data: { deleted: true }, status: 204 };
      const mockAxiosInstance = {
        delete: vi.fn().mockResolvedValue(mockResponse)
      };
      
      (httpClientInstance as any).axiosInstance = mockAxiosInstance;
      
      const result = await httpClientInstance.delete('/test/123');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ deleted: true });
        expect(result.status).toBe(204);
      }
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test/123');
    });
  });

  describe('error handling', () => {
    it('should handle HTTP error responses', async () => {
      const mockAxiosInstance = {
        get: vi.fn().mockRejectedValue({
          isAxiosError: true,
          response: {
            status: 404,
            statusText: 'Not Found',
            data: { message: 'Resource not found' }
          }
        })
      };
      
      (httpClientInstance as any).axiosInstance = mockAxiosInstance;
      
      const result = await httpClientInstance.get('/not-found');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Not Found');
        expect(result.status).toBe(404);
      }
    });

    it('should handle network errors', async () => {
      const mockAxiosInstance = {
        get: vi.fn().mockRejectedValue({
          isAxiosError: true,
          request: {},
          message: 'Network timeout'
        })
      };
      
      (httpClientInstance as any).axiosInstance = mockAxiosInstance;
      
      const result = await httpClientInstance.get('/timeout');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Network error: No response received');
        expect(result.status).toBeUndefined();
      }
    });

    it('should handle request setup errors', async () => {
      const mockAxiosInstance = {
        get: vi.fn().mockRejectedValue({
          isAxiosError: true,
          message: 'Invalid URL'
        })
      };
      
      (httpClientInstance as any).axiosInstance = mockAxiosInstance;
      
      const result = await httpClientInstance.get('invalid-url');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Request error: Invalid URL');
        expect(result.status).toBeUndefined();
      }
    });

    it('should handle non-axios errors', async () => {
      const mockAxiosInstance = {
        get: vi.fn().mockRejectedValue(new Error('Unexpected error'))
      };
      
      (httpClientInstance as any).axiosInstance = mockAxiosInstance;
      
      const result = await httpClientInstance.get('/test');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unexpected error');
        expect(result.status).toBeUndefined();
      }
    });
  });

  describe('configuration', () => {
    it('should get configuration from current profile', () => {
      const config = (httpClientInstance as any).getConfig();
      
      expect(config.baseURL).toBe('https://test.example.com');
      expect(config.timeout).toBe(15000);
      expect(config.userAgent).toBe('fx-cli/1.0.0');
    });

    it('should use default values when profile is missing', () => {
      mockConfigManager.getCurrentProfile.mockReturnValue(null);
      
      const config = (httpClientInstance as any).getConfig();
      
      expect(config.baseURL).toBe('https://api.example.com');
      expect(config.timeout).toBe(30000);
      expect(config.userAgent).toBe('fx-cli/1.0.0');
    });

    it('should update configuration when called', () => {
      const updateConfigSpy = vi.spyOn(httpClientInstance as any, 'setupInterceptors');
      
      httpClientInstance.updateConfig();
      
      expect(updateConfigSpy).toHaveBeenCalled();
    });
  });

  describe('singleton instance', () => {
    it('should export singleton instance', () => {
      expect(httpClient).toBeInstanceOf(HttpClient);
    });
  });
});
