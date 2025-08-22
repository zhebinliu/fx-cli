import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ConfigManager } from '../config/manager';

export interface HttpClientConfig {
  baseURL: string;
  timeout: number;
  userAgent: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export class HttpClient {
  private axiosInstance: AxiosInstance;
  private configManager: ConfigManager;

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

        // Log request (in development)
        if (process.env.NODE_ENV === 'development') {
          console.log(`🌐 HTTP Request: ${config.method?.toUpperCase()} ${config.url}`);
          if (config.data) {
            console.log('📤 Request Data:', JSON.stringify(config.data, null, 2));
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
        // Log response (in development)
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ HTTP Response: ${response.status} ${response.config.url}`);
        }
        return response;
      },
      (error: AxiosError) => {
        // Log error response
        if (error.response) {
          console.error(`❌ HTTP Error: ${error.response.status} ${error.config?.url}`);
          console.error('📋 Error Response:', error.response.data);
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
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.get<T>(url, config);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Make a POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.post<T>(url, data, config);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.put<T>(url, data, config);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.delete<T>(url, config);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
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
        return {
          success: false,
          error: `HTTP ${axiosError.response.status}: ${axiosError.response.statusText}`,
          status: axiosError.response.status
        };
      } else if (axiosError.request) {
        // Request made but no response
        return {
          success: false,
          error: 'Network error: No response received',
          status: 0
        };
      } else {
        // Request setup error
        return {
          success: false,
          error: `Request error: ${axiosError.message}`,
          status: 0
        };
      }
    } else {
      // Non-axios error
      return {
        success: false,
        error: `Unexpected error: ${error.message || 'Unknown error'}`,
        status: 0
      };
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
