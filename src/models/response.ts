/**
 * Base interface for all API responses
 */
export interface BaseResponse {
  success: boolean;
  status?: number;
  timestamp?: number;
}

/**
 * Generic success response with data
 */
export interface SuccessResponse<T = any> extends BaseResponse {
  success: true;
  data: T;
  status: number;
  timestamp: number;
}

/**
 * Generic error response
 */
export interface ErrorResponse extends BaseResponse {
  success: false;
  error: string;
  errorCode?: string | number;
  errorMessage?: string;
  status?: number;
  timestamp: number;
}

/**
 * Union type for all possible response types
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Fxiaoke API specific response structure
 */
export interface FxiaokeApiResponse<T = any> {
  errorCode: number;
  errorMessage: string;
  errorDescription?: string;
  traceId?: string;
  data?: T;
  [key: string]: any; // Allow additional fields
}

/**
 * Fxiaoke authentication response data
 */
export interface FxiaokeAuthData {
  corpAccessToken: string;
  corpId: string;
  expiresIn: number;
}

/**
 * Fxiaoke authentication response
 */
export interface FxiaokeAuthResponse extends FxiaokeApiResponse<FxiaokeAuthData> {}

/**
 * Response factory functions
 */
export class ResponseFactory {
  /**
   * Create a success response
   */
  static success<T>(data: T, status: number = 200): SuccessResponse<T> {
    return {
      success: true,
      data,
      status,
      timestamp: Date.now()
    };
  }

  /**
   * Create an error response
   */
  static error(
    error: string, 
    errorCode?: string | number, 
    errorMessage?: string, 
    status?: number
  ): ErrorResponse {
    return {
      success: false,
      error,
      errorCode,
      errorMessage,
      status,
      timestamp: Date.now()
    };
  }

  /**
   * Create an error response from an exception
   */
  static fromException(exception: Error, status?: number): ErrorResponse {
    return {
      success: false,
      error: exception.message,
      status,
      timestamp: Date.now()
    };
  }

  /**
   * Create an error response from HTTP status
   */
  static fromHttpStatus(status: number, message?: string): ErrorResponse {
    const defaultMessages: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout'
    };

    return {
      success: false,
      error: message || defaultMessages[status] || `HTTP Error ${status}`,
      status,
      timestamp: Date.now()
    };
  }
}
