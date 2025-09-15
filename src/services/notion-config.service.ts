import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

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
  private apiUrl = `${API_BASE_URL}/admin/notion-config`;
  
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }
  
  async getConfig(): Promise<NotionConfig> {
    try {
      const response = await axios.get(
        this.apiUrl,
        this.getAuthHeaders()
      );
      return response.data.data;
    } catch (error) {
      console.error('Error getting Notion config:', error);
      throw error;
    }
  }
  
  async saveConfig(config: SaveConfigPayload): Promise<any> {
    try {
      const response = await axios.post(
        this.apiUrl,
        config,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error saving Notion config:', error);
      throw error;
    }
  }
  
  async testConnection(databaseName: string): Promise<TestConnectionResponse> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/test`,
        { databaseName },
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error testing Notion connection:', error);
      throw error;
    }
  }
}

export const notionConfigService = new NotionConfigService();