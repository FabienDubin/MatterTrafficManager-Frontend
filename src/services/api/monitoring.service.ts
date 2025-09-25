import { apiClient } from './client';

export interface MemoryUsage {
  usedMemory: number;
  usedMemoryHuman: string;
  usedMemoryPeak: number;
  usedMemoryPeakHuman: string;
  maxMemory: number;
  maxMemoryHuman: string;
  usedMemoryPercent: number;
  totalKeys: number;
  expiredKeys: number;
}

export interface MemoryInfo {
  usedMemoryBytes: number;
  usedMemoryMB: number;
  maxMemoryBytes?: number;
  maxMemoryMB: number;
  usagePercentage: number;
  warningLevel: 'ok' | 'warning' | 'critical';
  keyCount: number;
  avgKeySize?: number;
  evictionPolicy?: string;
}

export interface MemoryResponse {
  success: boolean;
  data: {
    memory: MemoryInfo;
    distribution: Record<string, number>;
    recommendations: string[];
    lastCheck: string;
  };
}

export interface HealthStatus {
  status: string;
  message?: string;
  timestamp?: string;
  version?: string;
  uptime?: number;
  services?: {
    mongodb?: {
      status: string;
      message?: string;
    };
    redis?: {
      status: string;
      message?: string;
    };
    webhooks?: {
      status: string;
      message?: string;
    };
  };
  database?: {
    status: string;
    connected: boolean;
  };
  redis?: {
    status: string;
    connected: boolean;
  };
}

export interface SystemMetrics {
  cache?: {
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
  };
  memory?: MemoryInfo;
  timestamp?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

export const monitoringService = {
  async getMemoryUsage(): Promise<MemoryResponse> {
    const response = await apiClient.get<MemoryResponse>('/health/memory');
    return response.data;
  },

  async getHealthStatus(): Promise<HealthStatus> {
    try {
      const response = await apiClient.get<HealthStatus>('/health');
      return response.data;
    } catch (error: any) {
      // Handle 503 status - service might be degraded but still return data
      if (error.response?.status === 503 && error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  async getSystemMetrics(): Promise<SystemMetrics> {
    const response = await apiClient.get<{ success: boolean; cache?: any; memory?: any; timestamp?: string }>('/health/metrics');
    return response.data;
  }
};