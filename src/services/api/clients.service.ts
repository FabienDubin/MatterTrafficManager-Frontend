import { apiClient } from './client';
import type { 
  Client,
  ClientsResponse, 
  ClientColorsResponse, 
  UpdateClientColorsResponse 
} from '@/types/client.types';

export const clientsService = {
  /**
   * Fetch all clients from the API
   */
  async getAllClients(): Promise<ClientsResponse> {
    const response = await apiClient.get<ClientsResponse>('/clients');
    return response.data;
  },

  /**
   * Get client colors configuration
   */
  async getClientColors(): Promise<ClientColorsResponse> {
    const response = await apiClient.get<ClientColorsResponse>('/clients/colors');
    return response.data;
  },

  /**
   * Update client colors configuration (Admin only)
   */
  async updateClientColors(colors: Record<string, string>): Promise<UpdateClientColorsResponse> {
    const response = await apiClient.put<UpdateClientColorsResponse>('/clients/colors', { colors });
    return response.data;
  },
};