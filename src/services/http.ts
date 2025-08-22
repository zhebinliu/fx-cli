import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ConfigManager } from '../config/manager';
import { ApiResponse, ResponseFactory } from '../models/response';
import { ErrorFactory } from '../models/error';

export interface HttpClientConfig {
  baseURL: string;
  timeout: number;
  userAgent: string;
}

export interface HttpOptions {
  verbose?: boolean;
  debug?: boolean;
}

export class HttpClient {
  private axiosInstance: AxiosInstance;
  private configManager: ConfigManager;
  private currentOptions: HttpOptions = {};

  constructor() {
    this.configManager = new ConfigManager();
    this.axiosInstance = axios.create();
    this.setupInterceptors();
  }

  /**
   * Get HTTP client configuration from current profile
   */
  private getConfig(): HttpClientConfig {
    const currentProfile = this.configManager.getCurrentProfile();
    
    return {
      baseURL: currentProfile?.baseUrl || 'https://api.example.com',
      timeout: currentProfile?.timeout || 30000,
      userAgent: 'fx-cli/1.0.0'
    };
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const httpConfig = this.getConfig();
        
        // Set base configuration
        config.baseURL = httpConfig.baseURL;
        config.timeout = httpConfig.timeout;
        
        // Set default headers
        if (!config.headers) {
          config.headers = {} as any;
        }
        (config.headers as any)['User-Agent'] = httpConfig.userAgent;
        if (!(config.headers as any)['Content-Type']) {
          (config.headers as any)['Content-Type'] = 'application/json';
        }

        // Only log in verbose mode based on options
        if (this.currentOptions.verbose || this.currentOptions.debug) {
          console.log(`🌐 HTTP Request: ${config.method?.toUpperCase()} ${config.url}`);
          if (config.data) {
            console.log('📤 Request Data:', JSON.stringify(config.data, null, 2));
          }
          
          // Debug mode shows additional technical details
          if (this.currentOptions.debug) {
            console.log(`🔧 Debug: Base URL: ${config.baseURL}`);
            console.log(`🔧 Debug: Timeout: ${config.timeout}ms`);
            console.log(`🔧 Debug: Headers:`, JSON.stringify(config.headers, null, 2));
          }
        }

        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Only log in verbose mode based on options
        if (this.currentOptions.verbose || this.currentOptions.debug) {
          console.log(`✅ HTTP Response: ${response.status} ${response.config.url}`);
          
          // Debug mode shows additional response details
          if (this.currentOptions.debug) {
            console.log(`🔧 Debug: Response Headers:`, JSON.stringify(response.headers, null, 2));
            console.log(`🔧 Debug: Response Size: ${JSON.stringify(response.data).length} bytes`);
          }
        }
        return response;
      },
      (error: AxiosError) => {
        // Always log errors for debugging
        if (error.response) {
          console.error(`❌ HTTP Error: ${error.response.status} ${error.config?.url}`);
        } else if (error.request) {
          console.error('❌ Network Error: No response received');
        } else {
          console.error('❌ Request Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Make a GET request
   */
  async get<T>(url: string, options: HttpOptions = {}): Promise<ApiResponse<T>> {
    this.currentOptions = options;
    try {
      const response = await this.axiosInstance.get<T>(url);
      return ResponseFactory.success(response.data, response.status);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Make a POST request
   */
  async post<T>(url: string, data?: any, options: HttpOptions = {}): Promise<ApiResponse<T>> {
    this.currentOptions = options;
    try {
      const response = await this.axiosInstance.post<T>(url, data);
      return ResponseFactory.success(response.data, response.status);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Make a PUT request
   */
  async put<T>(url: string, data?: any, options: HttpOptions = {}): Promise<ApiResponse<T>> {
    this.currentOptions = options;
    try {
      const response = await this.axiosInstance.put<T>(url, data);
      return ResponseFactory.success(response.data, response.status);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(url: string, options: HttpOptions = {}): Promise<ApiResponse<T>> {
    this.currentOptions = options;
    try {
      const response = await this.axiosInstance.delete<T>(url);
      return ResponseFactory.success(response.data, response.status);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Handle axios errors and convert to unified format
   */
  private handleError(error: any): ApiResponse {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        // Server responded with error status
        return ResponseFactory.fromHttpStatus(
          axiosError.response.status,
          axiosError.response.statusText
        );
      } else if (axiosError.request) {
        // Request made but no response
        return ResponseFactory.error(
          'Network error: No response received',
          'NETWORK_ERROR'
        );
      } else {
        // Request setup error
        return ResponseFactory.error(
          `Request error: ${axiosError.message}`,
          'REQUEST_ERROR'
        );
      }
    } else {
      // Non-axios error
      return ResponseFactory.fromException(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Update configuration (useful for switching profiles)
   */
  updateConfig(): void {
    this.setupInterceptors();
  }

  /**
   * Get current axios instance (for advanced usage)
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

// Export singleton instance
export const httpClient = new HttpClient();
