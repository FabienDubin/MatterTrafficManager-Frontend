import { apiClient } from './client';

export interface CacheStats {
  totalKeys: number;
  keysByPrefix: Record<string, number>;
  sampleTTL: Array<{
    key: string;
    ttl: number;
  }>;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  totalRequests: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  responseTimePercentiles: {
    p50: number;
    p95: number;
    p99: number;
  };
  entityMetrics: Record<string, {
    hits: number;
    misses: number;
    requests: number;
    avgResponseTime: number;
  }>;
}

export interface InvalidateCacheOptions {
  pattern?: string;
  entityType?: string;
  entityId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

export const cacheService = {
  async clearCache(): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>('/admin/cache/clear', {});
    return response.data;
  },

  async warmupCache(): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>('/admin/cache/warmup', {});
    return response.data;
  },

  async getCacheStats(): Promise<ApiResponse<{ stats: CacheStats }>> {
    const response = await apiClient.get<ApiResponse<{ stats: CacheStats }>>('/admin/cache/stats');
    return response.data;
  },

  async getCacheMetrics(): Promise<ApiResponse<{ cache: CacheMetrics }>> {
    const response = await apiClient.get<ApiResponse<{ cache: CacheMetrics }>>('/admin/cache/metrics');
    return response.data;
  },

  async invalidateCache(options: InvalidateCacheOptions): Promise<ApiResponse<{ deletedCount: number }>> {
    const response = await apiClient.post<ApiResponse<{ deletedCount: number }>>('/admin/cache/invalidate', options);
    return response.data;
  }
};