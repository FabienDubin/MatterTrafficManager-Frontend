import { apiClient } from './client';

export interface Team {
  id: string;
  name: string;
}

export const teamsService = {
  /**
   * Get all teams from Notion
   */
  async getAllTeams(): Promise<{ success: boolean; data: Team[]; count: number }> {
    try {
      const response = await apiClient.get('/teams');
      return response.data;
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  }
};
