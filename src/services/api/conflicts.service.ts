import { apiClient } from './client';

export interface Conflict {
  id: string;
  entityType: 'Task' | 'Project' | 'Member' | 'Client' | 'Team';
  entityId: string;
  status: 'pending' | 'resolved' | 'failed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  localData: any;
  notionData: any;
  detectedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionStrategy?: 'notion_wins' | 'local_wins' | 'merged';
}

export interface ConflictStats {
  total: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  byEntityType: Record<string, number>;
}

export interface ConflictFilters {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
  entityType?: string;
}

export type ResolutionStrategy = 'local_wins' | 'notion_wins' | 'merged';

export const conflictsService = {
  /**
   * Get conflicts with filters
   */
  async getConflicts(filters?: ConflictFilters) {
    try {
      const response = await apiClient.get('/admin/conflicts', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching conflicts:', error);
      throw error;
    }
  },

  /**
   * Get conflict statistics
   */
  async getConflictStats() {
    try {
      const response = await apiClient.get('/admin/conflicts/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching conflict stats:', error);
      throw error;
    }
  },

  /**
   * Resolve a single conflict
   */
  async resolveConflict(conflictId: string, strategy: ResolutionStrategy, mergedData?: any, reason?: string) {
    try {
      const response = await apiClient.post(`/admin/conflicts/${conflictId}/resolve`, {
        strategy,
        mergedData,
        reason: reason || 'Manual resolution by admin'
      });
      return response.data;
    } catch (error) {
      console.error(`Error resolving conflict ${conflictId}:`, error);
      throw error;
    }
  },

  /**
   * Batch resolve conflicts
   */
  async batchResolveConflicts(conflictIds: string[], strategy: ResolutionStrategy, reason?: string) {
    try {
      const response = await apiClient.post('/admin/conflicts/batch-resolve', {
        conflictIds,
        strategy,
        reason: reason || 'Batch resolution by admin'
      });
      return response.data;
    } catch (error) {
      console.error('Error batch resolving conflicts:', error);
      throw error;
    }
  }
};