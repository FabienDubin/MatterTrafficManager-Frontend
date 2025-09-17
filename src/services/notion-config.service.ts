import { apiClient } from '@/services/api/client';

interface DatabaseConfig {
  id: string;
  name: string;
  lastTestDate?: Date;
  lastTestStatus?: 'success' | 'error' | 'pending';
  lastTestMessage?: string;
  entryCount?: number;
}

interface NotionConfig {
  environment: string;
  integrationToken: string;
  webhookVerificationToken?: string;
  webhookCaptureMode?: {
    enabled: boolean;
    enabledAt?: Date;
    capturedEvent?: {
      type: string;
      databaseId?: string;
      timestamp: Date;
      hasSignature: boolean;
    };
    capturedRequest?: {
      headers: any;
      body: any;
      method: string;
      url: string;
      timestamp: Date;
      signature?: string;
      detectedSecret?: string;
      secretLocation?: string;
    };
  };
  databases: {
    teams: DatabaseConfig;
    users: DatabaseConfig;
    clients: DatabaseConfig;
    projects: DatabaseConfig;
    traffic: DatabaseConfig;
  };
  mappings: any[];
  autoDetectEnabled: boolean;
  lastAutoDetectDate?: Date;
  version: number;
}

interface SaveConfigPayload {
  integrationToken: string;
  databases: Record<string, DatabaseConfig>;
}

interface TestConnectionResponse {
  success: boolean;
  message: string;
  data: {
    databaseName: string;
    databaseId: string;
    entryCount: number;
    hasMore: boolean;
    firstEntry: any;
  };
}

class NotionConfigService {
  private apiUrl = '/admin/notion-config';
  
  async getConfig(): Promise<NotionConfig> {
    try {
      const response = await apiClient.get(this.apiUrl);
      return response.data.data;
    } catch (error) {
      console.error('Error getting Notion config:', error);
      throw error;
    }
  }
  
  async saveConfig(config: SaveConfigPayload): Promise<any> {
    try {
      const response = await apiClient.post(this.apiUrl, config);
      return response.data;
    } catch (error) {
      console.error('Error saving Notion config:', error);
      throw error;
    }
  }
  
  async testConnection(databaseName: string, integrationToken?: string): Promise<TestConnectionResponse> {
    try {
      const response = await apiClient.post(`${this.apiUrl}/test`, { 
        databaseName,
        integrationToken 
      });
      return response.data;
    } catch (error) {
      console.error('Error testing Notion connection:', error);
      throw error;
    }
  }
  
  async enableCaptureMode(): Promise<any> {
    try {
      const response = await apiClient.post('/webhooks/notion/capture/enable');
      return response.data;
    } catch (error) {
      console.error('Error enabling capture mode:', error);
      throw error;
    }
  }
  
  async disableCaptureMode(): Promise<any> {
    try {
      const response = await apiClient.post('/webhooks/notion/capture/disable');
      return response.data;
    } catch (error) {
      console.error('Error disabling capture mode:', error);
      throw error;
    }
  }
  
  async testWebhook(): Promise<any> {
    try {
      const response = await apiClient.post('/webhooks/notion/test');
      return response.data;
    } catch (error) {
      console.error('Error testing webhook:', error);
      throw error;
    }
  }
  
  async clearCapturedData(): Promise<any> {
    try {
      const response = await apiClient.delete('/webhooks/notion/capture/data');
      return response.data;
    } catch (error) {
      console.error('Error clearing captured data:', error);
      throw error;
    }
  }
  
  async updateWebhookToken(webhookToken: string): Promise<any> {
    try {
      const response = await apiClient.post('/admin/notion-config/webhook-token', {
        webhookToken
      });
      return response.data;
    } catch (error) {
      console.error('Error updating webhook token:', error);
      throw error;
    }
  }
  
  async removeWebhookToken(): Promise<any> {
    try {
      const response = await apiClient.delete('/admin/notion-config/webhook-token');
      return response.data;
    } catch (error) {
      console.error('Error removing webhook token:', error);
      throw error;
    }
  }
}

export const notionConfigService = new NotionConfigService();