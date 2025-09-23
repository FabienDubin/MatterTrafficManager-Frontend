import { apiClient } from './client';

export interface Conflict {
  id: string;
  entityType: string;
  entityId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  localData: any;
  remoteData: any;
  detectedAt: string;
  metadata?: {
    fieldsDifferent?: string[];
    localVersion?: number;
    remoteVersion?: number;
  };
}

export type ResolutionStrategy = 'local_wins' | 'notion_wins' | 'merged';

export const conflictsService = {
  /**
   * Get all pending conflicts
   */
  async getConflicts(): Promise<Conflict[]> {
    try {
      const response = await apiClient.get('/admin/conflicts');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching conflicts:', error);
      throw error;
    }
  },

  /**
   * Resolve a single conflict
   */
  async resolveConflict(conflictId: string, strategy: ResolutionStrategy): Promise<void> {
    try {
      await apiClient.post(`/admin/conflicts/${conflictId}/resolve`, {
        strategy
      });
    } catch (error) {
      console.error(`Error resolving conflict ${conflictId}:`, error);
      throw error;
    }
  },

  /**
   * Resolve all conflicts with a single strategy
   */
  async resolveAllConflicts(strategy: ResolutionStrategy): Promise<void> {
    try {
      await apiClient.post('/admin/conflicts/resolve-all', {
        strategy
      });
    } catch (error) {
      console.error('Error resolving all conflicts:', error);
      throw error;
    }
  }
};