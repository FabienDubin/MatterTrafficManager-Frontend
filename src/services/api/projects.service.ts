import { apiClient } from './client';

/**
 * Project type returned by API
 */
export interface Project {
  id: string;
  name: string;
  status: string;
  client: string | null;
  clientName: string | null;
}

/**
 * API response for projects list
 */
interface ProjectsResponse {
  success: boolean;
  data: Project[];
  count: number;
  timestamp: string;
}

/**
 * Service for projects operations
 */
export const projectsService = {
  /**
   * Get all projects from Notion
   * GET /api/v1/projects
   */
  async getAllProjects(status?: string): Promise<Project[]> {
    try {
      const params = status ? { status } : undefined;
      const { data } = await apiClient.get<ProjectsResponse>('/projects', { params });
      return data.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  /**
   * Get active projects only (status = "En cours")
   * GET /api/v1/projects/active
   */
  async getActiveProjects(): Promise<Project[]> {
    try {
      const { data } = await apiClient.get<ProjectsResponse>('/projects/active');
      return data.data;
    } catch (error) {
      console.error('Error fetching active projects:', error);
      throw error;
    }
  }
};
