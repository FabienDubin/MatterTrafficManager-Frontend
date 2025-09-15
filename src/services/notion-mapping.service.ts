import { apiClient } from '@/services/api/client';

interface FieldMapping {
  applicationField: string;
  notionProperty: string;
  notionType: string;
  isRequired: boolean;
  transformFunction?: string;
}

interface DatabaseMapping {
  databaseName: string;
  fields: FieldMapping[];
  lastMappingDate?: Date;
  mappedFieldsCount: number;
}

interface AutoDetectResponse {
  success: boolean;
  message: string;
  data: {
    databaseName: string;
    databaseId: string;
    detectedFields: FieldMapping[];
    totalProperties: number;
    mappedCount: number;
    unknownCount: number;
  };
}

interface MappingResponse {
  success: boolean;
  data: {
    mappings: Record<string, DatabaseMapping>;
    totalMapped: number;
    lastAutoDetectDate?: Date;
    autoDetectEnabled: boolean;
  };
}

interface PreviewResponse {
  success: boolean;
  message: string;
  data: {
    databaseName: string;
    sampleCount: number;
    mappedFields: number;
    preview: any[];
  };
}

class NotionMappingService {
  private apiUrl = '/admin/notion-mapping';
  
  async autoDetect(databaseName: string): Promise<AutoDetectResponse> {
    try {
      const response = await apiClient.post(`${this.apiUrl}/auto-detect`, { databaseName });
      return response.data;
    } catch (error) {
      console.error('Error auto-detecting mapping:', error);
      throw error;
    }
  }
  
  async getMapping(databaseName?: string): Promise<MappingResponse> {
    try {
      const url = databaseName 
        ? `${this.apiUrl}?databaseName=${databaseName}`
        : this.apiUrl;
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error getting mapping:', error);
      throw error;
    }
  }
  
  async saveMapping(databaseName: string, fields: FieldMapping[]): Promise<any> {
    try {
      const response = await apiClient.post(this.apiUrl, { databaseName, fields });
      return response.data;
    } catch (error) {
      console.error('Error saving mapping:', error);
      throw error;
    }
  }
  
  async previewMapping(databaseName: string, limit: number = 5): Promise<PreviewResponse> {
    try {
      const response = await apiClient.post(`${this.apiUrl}/preview`, { databaseName, limit });
      return response.data;
    } catch (error) {
      console.error('Error previewing mapping:', error);
      throw error;
    }
  }
}

export const notionMappingService = new NotionMappingService();