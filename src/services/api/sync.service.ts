import { apiClient } from './client';

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'error' | 'conflict';
  pending: number;
  failed: number;
  conflicts: number;
  lastSync: string;
  nextRetry: string | null;
  queueDetails: {
    processing: boolean;
    avgProcessingTime: number;
    processed: number;
    itemsInQueue: Array<{
      id: string;
      type: string;
      entityType: string;
      attempts: number;
      createdAt: string;
      lastAttempt?: string;
      error?: string;
    }>;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, any>;
}

export const syncService = {
  /**
   * Get global sync status
   */
  async getStatus(): Promise<ApiResponse<SyncStatus>> {
    try {
      const response = await apiClient.get('/sync/status');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching sync status:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch sync status'
      };
    }
  },

  /**
   * Clear sync queue (admin only)
   */
  async clearQueue(): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post('/sync/clear-queue');
      return response.data;
    } catch (error: any) {
      console.error('Error clearing sync queue:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to clear sync queue'
      };
    }
  },

  /**
   * Retry failed items (admin only)
   */
  async retryFailed(): Promise<ApiResponse<{ retried: number }>> {
    try {
      const response = await apiClient.post('/sync/retry-failed');
      return response.data;
    } catch (error: any) {
      console.error('Error retrying failed items:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to retry items'
      };
    }
  }
};