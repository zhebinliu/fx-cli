import { ConfigManager } from '../config/manager';
import { httpClient } from './http';
import { FxiaokeResponseParser } from '../models/parser';
import { FxiaokeAuthData } from '../models/response';

export interface AuthResponse {
  success: boolean;
  accessToken?: string;
  corpId?: string;
  error?: string;
}

export interface AuthOptions {
  verbose?: boolean;
  debug?: boolean;
}

export class AuthService {
  private configManager: ConfigManager;

  constructor() {
    this.configManager = new ConfigManager();
  }

  async authenticate(options: AuthOptions = {}): Promise<AuthResponse> {
    try {
      const currentProfile = this.configManager.getCurrentProfile();
      if (!currentProfile) {
        return { success: false, error: 'No current profile set' };
      }

      const { appId, appSecret, permanentCode } = currentProfile;
      
      if (!appId || !appSecret || !permanentCode) {
        return { 
          success: false, 
          error: 'Missing authentication parameters. Please set appId, appSecret, and permanentCode.' 
        };
      }

      // Real Fxiaoke API endpoint
      const authEndpoint = '/cgi/corpAccessToken/get/V2';
      
      // Request data exactly as specified in the API documentation
      const requestData = {
        appId,
        appSecret,
        permanentCode
      };
      
      const response = await httpClient.post(authEndpoint, requestData, { verbose: options.verbose, debug: options.debug });

      if (!response.success) {
        return { success: false, error: response.error || 'Authentication failed' };
      }

      return this.handleApiResponse(response.data, currentProfile);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  async getToken(): Promise<string | null> {
    const currentProfile = this.configManager.getCurrentProfile();
    if (!currentProfile?.corpAccessToken) {
      return null;
    }
    return currentProfile.corpAccessToken;
  }

  async getCorpId(): Promise<string | null> {
    const currentProfile = this.configManager.getCurrentProfile();
    if (!currentProfile?.corpId) {
      return null;
    }
    return currentProfile.corpId;
  }

  private handleApiResponse(apiData: unknown, currentProfile: { name: string }): AuthResponse {
    // Use the Fxiaoke response parser for consistent error handling
    const parsedResponse = FxiaokeResponseParser.parseAuthResponse(apiData);
    
    if (!parsedResponse.success) {
      return {
        success: false,
        error: parsedResponse.error || 'Authentication failed'
      };
    }

    const authData = parsedResponse.data as FxiaokeAuthData;
    
    if (authData.corpAccessToken && authData.corpId) {
      // Save the real tokens to the current profile
      this.configManager.setProfileValue(currentProfile.name, 'corpAccessToken', authData.corpAccessToken);
      this.configManager.setProfileValue(currentProfile.name, 'corpId', authData.corpId);
      
      return {
        success: true,
        accessToken: authData.corpAccessToken,
        corpId: authData.corpId
      };
    } else {
      return {
        success: false,
        error: 'API response missing required fields (corpAccessToken, corpId)'
      };
    }
  }
}
