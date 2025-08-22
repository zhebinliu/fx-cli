import { FxiaokeApiResponse, FxiaokeAuthData, FxiaokeAuthResponse } from './response';
import { FxiaokeApiError, ErrorFactory } from './error';
import { ApiResponse, SuccessResponse, ErrorResponse } from './response';

/**
 * Parser for Fxiaoke API responses
 */
export class FxiaokeResponseParser {
  /**
   * Parse a Fxiaoke API response and convert to unified format
   */
  static parse<T = any>(rawResponse: any): ApiResponse<T> {
    try {
      // Check if response has Fxiaoke API structure
      if (this.isFxiaokeApiResponse(rawResponse)) {
        return this.parseFxiaokeResponse(rawResponse);
      }

      // If not Fxiaoke format, treat as generic success
      return {
        success: true,
        data: rawResponse,
        status: 200,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Parse Fxiaoke authentication response specifically
   */
  static parseAuthResponse(rawResponse: any): ApiResponse<FxiaokeAuthData> {
    try {
      if (!this.isFxiaokeApiResponse(rawResponse)) {
        return {
          success: false,
          error: 'Response is not in Fxiaoke API format',
          timestamp: Date.now()
        };
      }

      const fxiaokeResponse = rawResponse as FxiaokeAuthResponse;

      // Check for API errors first
      if (fxiaokeResponse.errorCode !== 0) {
        return {
          success: false,
          error: `Fxiaoke API Error (${fxiaokeResponse.errorCode}): ${fxiaokeResponse.errorMessage}`,
          errorCode: fxiaokeResponse.errorCode,
          errorMessage: fxiaokeResponse.errorMessage,
          timestamp: Date.now()
        };
      }

      // Extract authentication data
      const authData: FxiaokeAuthData = {
        corpAccessToken: fxiaokeResponse.corpAccessToken,
        corpId: fxiaokeResponse.corpId,
        expiresIn: fxiaokeResponse.expiresIn
      };

      // Validate required fields
      if (!authData.corpAccessToken || !authData.corpId) {
        return {
          success: false,
          error: 'Authentication response missing required fields (corpAccessToken, corpId)',
          timestamp: Date.now()
        };
      }

      return {
        success: true,
        data: authData,
        status: 200,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse authentication response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Check if response has Fxiaoke API structure
   */
  private static isFxiaokeApiResponse(response: any): response is FxiaokeApiResponse {
    return (
      response &&
      typeof response === 'object' &&
      typeof response.errorCode === 'number' &&
      typeof response.errorMessage === 'string'
    );
  }

  /**
   * Parse generic Fxiaoke API response
   */
  private static parseFxiaokeResponse<T>(response: FxiaokeApiResponse<T>): ApiResponse<T> {
    // Check for API errors
    if (response.errorCode !== 0) {
      return {
        success: false,
        error: `Fxiaoke API Error (${response.errorCode}): ${response.errorMessage}`,
        errorCode: response.errorCode,
        errorMessage: response.errorMessage,
        timestamp: Date.now()
      };
    }

    // Success response
    return {
      success: true,
      data: response.data as T,
      status: 200,
      timestamp: Date.now()
    };
  }

  /**
   * Create a FxiaokeApiError from response data
   */
  static createErrorFromResponse(response: FxiaokeApiResponse): FxiaokeApiError {
    return ErrorFactory.fxiaokeApiError(
      response.errorCode,
      response.errorMessage,
      response.errorDescription,
      response.traceId
    );
  }

  /**
   * Check if a Fxiaoke API error is retryable
   */
  static isRetryableError(response: FxiaokeApiResponse): boolean {
    if (response.errorCode === 0) {
      return false;
    }

    const error = this.createErrorFromResponse(response);
    return error.isRetryable();
  }

  /**
   * Extract error information for logging
   */
  static extractErrorInfo(response: FxiaokeApiResponse): {
    errorCode: number;
    errorMessage: string;
    errorDescription?: string;
    traceId?: string;
    isRetryable: boolean;
  } {
    const error = this.createErrorFromResponse(response);
    
    return {
      errorCode: response.errorCode,
      errorMessage: response.errorMessage,
      errorDescription: response.errorDescription,
      traceId: response.traceId,
      isRetryable: error.isRetryable()
    };
  }
}
