import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

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
  private apiUrl = `${API_BASE_URL}/admin/notion-mapping`;
  
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }
  
  async autoDetect(databaseName: string): Promise<AutoDetectResponse> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/auto-detect`,
        { databaseName },
        this.getAuthHeaders()
      );
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
      
      const response = await axios.get(
        url,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error getting mapping:', error);
      throw error;
    }
  }
  
  async saveMapping(databaseName: string, fields: FieldMapping[]): Promise<any> {
    try {
      const response = await axios.post(
        this.apiUrl,
        { databaseName, fields },
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error saving mapping:', error);
      throw error;
    }
  }
  
  async previewMapping(databaseName: string, limit: number = 5): Promise<PreviewResponse> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/preview`,
        { databaseName, limit },
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error previewing mapping:', error);
      throw error;
    }
  }
}

export const notionMappingService = new NotionMappingService();