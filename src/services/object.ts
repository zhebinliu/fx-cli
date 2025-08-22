import { httpClient } from './http';
import { ConfigManager } from '../config/manager';
import { ApiResponse, ResponseFactory } from '../models/response';
import { FxiaokeResponseParser } from '../models/parser';

export interface ObjectListOptions {
  verbose?: boolean;
  debug?: boolean;
  pageSize?: number;
  pageNumber?: number;
  objectType?: string;
}

export interface FxiaokeObject {
  id: string;
  name: string;
  objectType: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  [key: string]: unknown; // Allow for additional object properties
}

export interface ObjectListResponse {
  objects: FxiaokeObject[];
  totalCount: number;
  pageSize: number;
  pageNumber: number;
  hasMore: boolean;
}

export class ObjectService {
  private configManager: ConfigManager;

  constructor() {
    this.configManager = new ConfigManager();
  }

  /**
   * List objects from the organization
   * Based on Fxiaoke OpenAPI: https://www.fxiaoke.com/proj/page/openapidocs/#/home?docId=1104&categoryId=116
   * Correct endpoint: https://open.fxiaoke.com/cgi/crm/v2/object/list
   * Flow: First get currentOpenUserId from /cgi/user/getByMobile, then call object list
   */
  async listObjects(options: ObjectListOptions = {}): Promise<ApiResponse<ObjectListResponse>> {
    try {
      const currentProfile = this.configManager.getCurrentProfile();
      if (!currentProfile) {
        return ResponseFactory.error('No current profile set. Please use `fx config --profile <name>` to set one.');
      }

      const { corpAccessToken, corpId } = currentProfile;
      if (!corpAccessToken || !corpId) {
        return ResponseFactory.error('Not authenticated. Please run `fx auth --login` first.');
      }

      // First, get the currentOpenUserId using the mobile number
      console.log('📱 Getting currentOpenUserId from mobile number...');
      const userResponse = await this.getCurrentOpenUserId(corpAccessToken, corpId, '18513231017');
      
      if (!userResponse.success) {
        return ResponseFactory.error(`Failed to get currentOpenUserId: ${userResponse.error}`);
      }

      const currentOpenUserId = userResponse.data as string;
      console.log(`✅ Got currentOpenUserId: ${currentOpenUserId}`);

      // Default pagination
      const pageSize = options.pageSize || 20;
      const pageNumber = options.pageNumber || 1;

      // Use the correct Fxiaoke API endpoint
      const endpoint = '/cgi/crm/v2/object/list';
      
      // Request payload based on Fxiaoke API specification
      const requestData = {
        corpAccessToken,
        corpId,
        currentOpenUserId,
        pageSize,
        pageNumber,
        ...(options.objectType && { objectType: options.objectType })
      };

      console.log('📋 Fetching object list...');
      
      const response = await httpClient.post<Record<string, unknown>>(endpoint, requestData, {
        verbose: options.verbose,
        debug: options.debug
      });

      if (!response.success) {
        return ResponseFactory.error(`Failed to fetch objects: ${response.error}`);
      }

      // Debug: Log the actual object list response structure
      console.log('📋 Object List API Response Data:', JSON.stringify(response.data, null, 2));

      return this.handleObjectListResponse(response.data);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return ResponseFactory.error(`Object list error: ${errorMessage}`);
    }
  }

  /**
   * Get currentOpenUserId from mobile number
   * Endpoint: https://open.fxiaoke.com/cgi/user/getByMobile
   */
  private async getCurrentOpenUserId(corpAccessToken: string, corpId: string, mobile: string): Promise<ApiResponse<string>> {
    try {
      const endpoint = '/cgi/user/getByMobile';
      
      const requestData = {
        corpAccessToken,
        corpId,
        mobile
      };

      const response = await httpClient.post<Record<string, unknown>>(endpoint, requestData);

      if (!response.success) {
        return ResponseFactory.error(`Failed to get user ID: ${response.error}`);
      }

      // Debug: Log the actual response structure
      console.log('📋 User API Response Data:', JSON.stringify(response.data, null, 2));

      // Work directly with the raw response since we can see the structure
      const rawData = response.data as Record<string, unknown>;
      
      // Check if the response indicates success
      if (rawData.errorCode !== 0) {
        const errorMsg = rawData.errorMessage || rawData.errorDescription || 'Unknown error';
        return ResponseFactory.error(`API Error: ${errorMsg}`);
      }
      
      // Extract currentOpenUserId from the actual response structure
      let currentOpenUserId: string | undefined;
      
      if (rawData.empList && Array.isArray(rawData.empList) && rawData.empList.length > 0) {
        const firstEmployee = rawData.empList[0] as Record<string, unknown>;
        currentOpenUserId = firstEmployee.openUserId as string;
      }
      
      // Fallback to other possible fields
      if (!currentOpenUserId) {
        const fallbackId = rawData.currentOpenUserId || rawData.userId || rawData.id;
        if (typeof fallbackId === 'string') {
          currentOpenUserId = fallbackId;
        }
      }

      if (!currentOpenUserId || typeof currentOpenUserId !== 'string') {
        return ResponseFactory.error('Response missing currentOpenUserId');
      }

      return ResponseFactory.success(currentOpenUserId);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return ResponseFactory.error(`Get user ID error: ${errorMessage}`);
    }
  }

  /**
   * Handle the object list API response
   */
  private handleObjectListResponse(apiData: Record<string, unknown>): ApiResponse<ObjectListResponse> {
    try {
      // Work directly with the raw response since we can see the structure
      const rawData = apiData as Record<string, unknown>;
      
      // Check if the response indicates success
      if (rawData.errorCode !== 0) {
        const errorMsg = rawData.errorMessage || rawData.errorDescription || 'Unknown error';
        return ResponseFactory.error(`API Error: ${errorMsg}`);
      }

      // Extract object list data from the actual response structure
      let objects: FxiaokeObject[] = [];
      let totalCount = 0;
      let pageSize = 20;
      let pageNumber = 1;
      let hasMore = false;

      // Try different possible response structures
      if (rawData.data && typeof rawData.data === 'object') {
        const dataObj = rawData.data as Record<string, unknown>;
        
        if (dataObj.objects && Array.isArray(dataObj.objects)) {
          // Transform the actual API response to our expected format
          objects = (dataObj.objects as Array<Record<string, unknown>>).map(obj => ({
            id: obj.describeApiName as string || 'N/A',
            name: obj.describeDisplayName as string || 'N/A',
            objectType: obj.defineType as string || 'N/A',
            createdAt: obj.createTime ? new Date(obj.createTime as number).toISOString() : 'N/A',
            updatedAt: obj.updateTime ? new Date(obj.updateTime as number).toISOString() : 'N/A',
            isActive: obj.isActive as boolean || false
          }));
        } else if (dataObj.list && Array.isArray(dataObj.list)) {
          objects = dataObj.list as FxiaokeObject[];
        }
      } else if (rawData.objects && Array.isArray(rawData.objects)) {
        objects = rawData.objects as FxiaokeObject[];
      } else if (rawData.list && Array.isArray(rawData.list)) {
        objects = rawData.list as FxiaokeObject[];
      }

      // Extract pagination info
      if (typeof rawData.totalCount === 'number') {
        totalCount = rawData.totalCount;
      } else if (typeof rawData.total === 'number') {
        totalCount = rawData.total;
      } else if (typeof rawData.count === 'number') {
        totalCount = rawData.count;
      } else {
        // If no total count provided, use the actual objects count
        totalCount = objects.length;
      }

      if (typeof rawData.pageSize === 'number') {
        pageSize = rawData.pageSize;
      }

      if (typeof rawData.pageNumber === 'number') {
        pageNumber = rawData.pageNumber;
      } else if (typeof rawData.page === 'number') {
        pageNumber = rawData.page;
      }

      if (typeof rawData.hasMore === 'boolean') {
        hasMore = rawData.hasMore;
      } else if (typeof rawData.nextPage === 'boolean') {
        hasMore = rawData.nextPage;
      }

      const result: ObjectListResponse = {
        objects,
        totalCount,
        pageSize,
        pageNumber,
        hasMore
      };

      return ResponseFactory.success(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return ResponseFactory.error(`Failed to parse object list response: ${errorMessage}`);
    }
  }

  /**
   * Get a specific object by ID
   */
  async getObject(objectId: string, options: ObjectListOptions = {}): Promise<ApiResponse<FxiaokeObject>> {
    try {
      const currentProfile = this.configManager.getCurrentProfile();
      if (!currentProfile) {
        return ResponseFactory.error('No current profile set. Please use `fx config --profile <name>` to set one.');
      }

      const { corpAccessToken, corpId } = currentProfile;
      if (!corpAccessToken || !corpId) {
        return ResponseFactory.error('Not authenticated. Please run `fx auth --login` first.');
      }

      // First, get the currentOpenUserId using the mobile number
      const userResponse = await this.getCurrentOpenUserId(corpAccessToken, corpId, '18513231017');
      
      if (!userResponse.success) {
        return ResponseFactory.error(`Failed to get currentOpenUserId: ${userResponse.error}`);
      }

      const currentOpenUserId = userResponse.data as string;

      const endpoint = '/cgi/crm/v2/object/get';
      
      const requestData = {
        corpAccessToken,
        corpId,
        currentOpenUserId,
        objectId
      };

      console.log(`📋 Fetching object ${objectId}...`);
      
      const response = await httpClient.post<Record<string, unknown>>(endpoint, requestData, {
        verbose: options.verbose,
        debug: options.debug
      });

      if (!response.success) {
        return ResponseFactory.error(`Failed to fetch object: ${response.error}`);
      }

      return this.handleObjectResponse(response.data);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return ResponseFactory.error(`Get object error: ${errorMessage}`);
    }
  }

  /**
   * Handle single object API response
   */
  private handleObjectResponse(apiData: Record<string, unknown>): ApiResponse<FxiaokeObject> {
    try {
      const parsedResponse = FxiaokeResponseParser.parse(apiData);
      
      if (!parsedResponse.success) {
        return ResponseFactory.error(`API Error: ${parsedResponse.error}`);
      }

      const objectData = parsedResponse.data as FxiaokeObject;
      return ResponseFactory.success(objectData);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return ResponseFactory.error(`Failed to parse object response: ${errorMessage}`);
    }
  }
}