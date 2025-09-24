import { apiClient } from './client';

export interface LatencyMetrics {
  redis: {
    count: number;
    avgLatency: number;
    minLatency: number;
    maxLatency: number;
    p95Latency: number;
    p99Latency: number;
    slowOperations: number;
    threshold: number;
  };
  notion: {
    count: number;
    avgLatency: number;
    minLatency: number;
    maxLatency: number;
    p95Latency: number;
    p99Latency: number;
    slowOperations: number;
    threshold: number;
  };
  comparison: {
    avgSpeedup: string;
    redisVsNotion: string;
    recommendation: string;
  };
  lastUpdated: string;
}

export interface QueueMetrics {
  queue: {
    length: number;
    processing: boolean;
  };
  performance: {
    processed: number;
    failed: number;
    retries: number;
    avgProcessingTime: number;
  };
  items: any[];
}

export interface DashboardMetrics {
  cache: {
    hitRate: number;
    avgResponseTime: number;
    totalRequests: number;
  };
  latency: LatencyMetrics;
  queue: {
    length: number;
    processed: number;
    failed: number;
    avgProcessingTime: number;
  };
  memory: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

export const metricsService = {
  async getLatencyMetrics(): Promise<ApiResponse<LatencyMetrics>> {
    const response = await apiClient.get<ApiResponse<LatencyMetrics>>('/admin/metrics/latency');
    return response.data;
  },

  async getLatencyHistory(hours: number = 24): Promise<ApiResponse<{ hours: number; metrics: any[] }>> {
    const response = await apiClient.get<ApiResponse<{ hours: number; metrics: any[] }>>(`/admin/metrics/latency/history?hours=${hours}`);
    return response.data;
  },

  async getQueueMetrics(): Promise<ApiResponse<QueueMetrics>> {
    const response = await apiClient.get<ApiResponse<QueueMetrics>>('/admin/metrics/queue');
    return response.data;
  },

  async getDashboard(): Promise<ApiResponse<DashboardMetrics>> {
    const response = await apiClient.get<ApiResponse<DashboardMetrics>>('/admin/metrics/dashboard');
    return response.data;
  },

  async resetMetrics(type?: 'cache' | 'latency' | 'queue' | 'all'): Promise<ApiResponse<void>> {
    const query = type ? `?type=${type}` : '';
    const response = await apiClient.post<ApiResponse<void>>(`/admin/metrics/reset${query}`, {});
    return response.data;
  },

  async getActiveUsers(): Promise<ApiResponse<{ count: number; users: string[] }>> {
    const response = await apiClient.get<ApiResponse<{ count: number; users: string[] }>>('/admin/metrics/active-users');
    return response.data;
  },

  async getRequestRate(): Promise<ApiResponse<{ requestsPerMinute: number; requestsPerSecond: number }>> {
    const response = await apiClient.get<ApiResponse<{ requestsPerMinute: number; requestsPerSecond: number }>>('/admin/metrics/request-rate');
    return response.data;
  },

  async getRecentErrors(): Promise<ApiResponse<{ recent: any[]; total24h: number }>> {
    const response = await apiClient.get<ApiResponse<{ recent: any[]; total24h: number }>>('/admin/metrics/errors');
    return response.data;
  }
};