import { ConfigManager } from '../config/manager';
import { httpClient } from './http';

export interface AuthResponse {
  success: boolean;
  accessToken?: string;
  corpId?: string;
  error?: string;
}

export class AuthService {
  private configManager: ConfigManager;

  constructor() {
    this.configManager = new ConfigManager();
  }

  async authenticate(): Promise<AuthResponse> {
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

      console.log('🔐 Authenticating with parameters:');
      console.log('  Making API call to authentication endpoint...');
      
      // Real Fxiaoke API endpoint
      const authEndpoint = '/cgi/corpAccessToken/get/V2';
      
      // Request data exactly as specified in the API documentation
      const requestData = {
        appId,
        appSecret,
        permanentCode
      };
      
      console.log('📤 Request Data:', JSON.stringify(requestData, null, 2));
      console.log('📡 Making POST request to authentication endpoint...');
      
      const response = await httpClient.post(authEndpoint, requestData);

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

  private handleApiResponse(apiData: Record<string, any>, currentProfile: { name: string }): AuthResponse {
    console.log('✅ API response received');
    
    // Debug: Log the actual response structure
    console.log('📋 API Response Data:', JSON.stringify(apiData, null, 2));
    
    // Handle Fxiaoke API response format
    if (apiData) {
      // Check for Fxiaoke API errors first
      if (apiData.errorCode && apiData.errorCode !== 0) {
        return {
          success: false,
          error: `Fxiaoke API Error (${apiData.errorCode}): ${apiData.errorMessage}`
        };
      }
      
      // Extract the actual fields from your API response
      // Update these field names based on your API spec
      const accessToken = apiData.accessToken || apiData.token || apiData.access_token || apiData.corpAccessToken;
      const corpId = apiData.corpId || apiData.corp_id || apiData.organizationId || apiData.corpId;
      
      if (accessToken && corpId) {
        // Save the real tokens to the current profile
        this.configManager.setProfileValue(currentProfile.name, 'corpAccessToken', accessToken);
        this.configManager.setProfileValue(currentProfile.name, 'corpId', corpId);
        
        return {
          success: true,
          accessToken,
          corpId
        };
      } else {
        return {
          success: false,
          error: 'API response missing required fields (accessToken, corpId)'
        };
      }
    } else {
      return {
        success: false,
        error: 'API response is empty or invalid'
      };
    }
  }
}
