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
  notionToken: string;
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
  notionToken: string;
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
  
  async testConnection(databaseName: string): Promise<TestConnectionResponse> {
    try {
      const response = await apiClient.post(`${this.apiUrl}/test`, { databaseName });
      return response.data;
    } catch (error) {
      console.error('Error testing Notion connection:', error);
      throw error;
    }
  }
}

export const notionConfigService = new NotionConfigService();