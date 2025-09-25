import { apiClient } from './client';

export interface WebhookLog {
  _id: string;
  entityType: 'Task' | 'Project' | 'Member' | 'Team' | 'Client';
  databaseId: string;
  syncMethod: 'webhook';
  syncStatus: 'success' | 'failed' | 'partial';
  itemsProcessed: number;
  itemsFailed: number;
  startTime: string;
  endTime: string;
  duration: number;
  syncErrors?: string[];
  webhookEventId?: string;
  createdAt: string;
}

export interface WebhookStats {
  total: number;
  byStatus: {
    [key: string]: {
      count: number;
      avgDuration: number;
    };
  };
}

export interface WebhookStatus {
  configured: boolean;
  tokenValid: boolean;
  recentActivity: boolean;
  lastWebhookAt?: string;
  status: string;
}

export interface WebhookLogFilters {
  page?: number;
  limit?: number;
  entityType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export const webhookService = {
  /**
   * Get webhook logs with filters
   */
  async getLogs(filters?: WebhookLogFilters) {
    try {
      const response = await apiClient.get('/webhooks/logs', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching webhook logs:', error);
      throw error;
    }
  },

  /**
   * Test webhook configuration
   */
  async testWebhook() {
    try {
      const response = await apiClient.post('/webhooks/notion/test');
      return response.data;
    } catch (error) {
      console.error('Error testing webhook:', error);
      throw error;
    }
  },

  /**
   * Get capture status
   */
  async getCaptureStatus() {
    try {
      const response = await apiClient.get('/webhooks/notion/capture/status');
      return response.data;
    } catch (error) {
      console.error('Error getting capture status:', error);
      throw error;
    }
  }
};