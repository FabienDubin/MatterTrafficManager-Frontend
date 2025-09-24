import { useQuery } from '@tanstack/react-query';
import { monitoringService } from '@/services/api/monitoring.service';
import { metricsService } from '@/services/api/metrics.service';
import { tasksService } from '@/services/api/tasks.service';
import { useSyncStatus } from './useSyncStatus';
import { useCacheMetrics } from './useCacheMetrics';
import { toast } from 'sonner';

interface RealtimeMetrics {
  health: {
    redis: 'operational' | 'degraded' | 'down';
    notion: 'operational' | 'degraded' | 'down';
    api: 'operational' | 'degraded' | 'down';
    mongodb: 'operational' | 'degraded' | 'down';
  };
  activity: {
    requestsPerMinute: number;
    activeUsers: number;
    todayTasks: {
      total: number;
      completed: number;
      inProgress: number;
    };
  };
  errors: {
    recent: Array<{
      id: string;
      message: string;
      type: string;
      timestamp: string;
      count: number;
    }>;
    total24h: number;
  };
  performance: {
    avgLatency: number;
    p95Latency: number;
    p99Latency: number;
  };
}

export function useRealtimeMetrics(pollingInterval = 5000) {
  // Use existing hooks
  const { syncStatus, isServerDown } = useSyncStatus({ refetchInterval: pollingInterval });
  const { cache, hitRate, memory, clearCache, isClearing } = useCacheMetrics(pollingInterval);

  // Fetch health status
  const { data: health } = useQuery({
    queryKey: ['health-status'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/v1/health');
        if (!response.ok) throw new Error('Failed to fetch health');
        const data = await response.json();
        return data.services || null;
      } catch {
        return null;
      }
    },
    refetchInterval: pollingInterval,
  });

  // Fetch activity metrics
  const { data: activity } = useQuery({
    queryKey: ['activity-metrics'],
    queryFn: async () => {
      try {
        // Fetch all metrics in parallel
        const [activeUsersRes, requestRateRes, tasksRes] = await Promise.all([
          metricsService.getActiveUsers(),
          metricsService.getRequestRate(),
          tasksService.getTodayStats()
        ]);
        
        return {
          requestsPerMinute: requestRateRes?.data?.requestsPerMinute || 0,
          activeUsers: activeUsersRes?.data?.count || 0,
          todayTasks: tasksRes || { total: 0, completed: 0, inProgress: 0 }
        };
      } catch (error) {
        console.error('Failed to fetch activity metrics:', error);
        return {
          requestsPerMinute: 0,
          activeUsers: 0,
          todayTasks: { total: 0, completed: 0, inProgress: 0 }
        };
      }
    },
    refetchInterval: pollingInterval,
  });

  // Fetch error metrics
  const { data: errors } = useQuery({
    queryKey: ['error-metrics'],
    queryFn: async () => {
      try {
        const errorsRes = await metricsService.getRecentErrors();
        return errorsRes?.data || { recent: [], total24h: 0 };
      } catch {
        return { recent: [], total24h: 0 };
      }
    },
    refetchInterval: pollingInterval * 2, // Less frequent for errors
  });

  // Quick Actions
  const handleClearAllCache = async () => {
    if (!confirm('Êtes-vous sûr de vouloir vider tout le cache ?')) return;
    
    try {
      clearCache();
      toast.success('Cache vidé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la suppression du cache');
    }
  };

  const handleClearCacheByType = async (type: string) => {
    // TODO: Implement clear cache by type endpoint
    toast.info(`Clear cache ${type}: Fonctionnalité en cours de développement`);
  };

  const handleToggleWebhooks = async (_enabled: boolean) => {
    // TODO: Implémenter l'endpoint backend pour activer/désactiver les webhooks
    toast.info('Fonctionnalité en cours de développement');
  };

  // Compute derived health status
  const healthStatus = {
    redis: health?.redis?.status === 'healthy' ? 'operational' : health?.redis?.status === 'unhealthy' ? 'down' : 'unknown',
    notion: 'operational', // Hardcoded for now
    api: isServerDown ? 'down' : 'operational',
    mongodb: health?.mongodb?.status === 'healthy' ? 'operational' : health?.mongodb?.status === 'unhealthy' ? 'down' : 'unknown',
    webhooks: health?.webhooks?.status === 'healthy' ? 'active' : 'inactive'
  };

  // Compute performance metrics
  const performance = {
    avgLatency: activity?.requestsPerMinute ? 
      Math.round(cache?.avgResponseTime || 0) : 0,
    p95Latency: cache?.responseTimePercentiles?.p95 || 0,
    p99Latency: cache?.responseTimePercentiles?.p99 || 0
  };

  return {
    // Core metrics
    health: healthStatus,
    activity: activity || {
      requestsPerMinute: 0,
      activeUsers: 0,
      todayTasks: { total: 0, completed: 0, inProgress: 0 }
    },
    errors: errors || { recent: [], total24h: 0 },
    performance,
    
    // Cache metrics
    cache: {
      hitRate: Math.round(hitRate),
      totalRequests: cache?.totalRequests || 0,
      size: 0, // TODO: Add cache size when available in backend
      memory: memory?.usagePercentage || 0
    },
    
    // Sync status
    sync: {
      status: syncStatus?.status || 'unknown',
      queueLength: syncStatus?.pending || 0,
      conflicts: syncStatus?.conflicts || 0,
      failed: syncStatus?.failed || 0,
      lastSync: syncStatus?.lastSync
    },
    
    // Quick actions
    actions: {
      clearAllCache: handleClearAllCache,
      clearCacheByType: handleClearCacheByType,
      toggleWebhooks: handleToggleWebhooks,
      isClearing
    },
    
    // Connection status
    isServerDown
  };
}