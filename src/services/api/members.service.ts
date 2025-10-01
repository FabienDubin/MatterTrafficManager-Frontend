import { apiClient } from './client';

/**
 * Member type returned by API
 */
export interface Member {
  id: string;
  name: string;
  email: string;
  teams?: string[];
}

/**
 * API response for members list
 */
interface MembersResponse {
  success: boolean;
  data: Member[];
  count: number;
  timestamp: string;
}

/**
 * Service for members operations
 */
export const membersService = {
  /**
   * Get all members from Notion
   * GET /api/v1/members
   */
  async getAllMembers(): Promise<Member[]> {
    try {
      const { data } = await apiClient.get<MembersResponse>('/members');
      return data.data;
    } catch (error) {
      console.error('Error fetching members:', error);
      throw error;
    }
  }
};
