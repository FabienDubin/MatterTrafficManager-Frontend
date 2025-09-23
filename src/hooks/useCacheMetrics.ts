import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { monitoringService } from '@/services/api/monitoring.service';
import { cacheService } from '@/services/api/cache.service';
import { toast } from 'sonner';

export function useCacheMetrics(pollingInterval = 5000) {
  const [isPolling, setIsPolling] = useState(true);

  // Fetch system metrics (cache + memory)
  const fetchMetrics = async () => {
    try {
      return await monitoringService.getSystemMetrics();
    } catch (error) {
      console.error('Failed to fetch system metrics:', error);
      throw error;
    }
  };

  // Use React Query for polling
  const {
    data: metrics,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['systemMetrics'],
    queryFn: fetchMetrics,
    refetchInterval: isPolling ? pollingInterval : false,
    refetchIntervalInBackground: false,
    retry: 2,
  });

  // Clear cache mutation
  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      return await cacheService.clearCache();
    },
    onSuccess: () => {
      toast.success('Cache vidé', {
        description: 'Le cache a été vidé avec succès',
      });
      // Refetch metrics after clearing
      refetch();
    },
    onError: (error) => {
      console.error('Failed to clear cache:', error);
      toast.error('Erreur', {
        description: 'Impossible de vider le cache',
      });
    },
  });

  // Force warmup mutation
  const forceWarmupMutation = useMutation({
    mutationFn: async () => {
      return await cacheService.warmupCache();
    },
    onSuccess: () => {
      toast.success('Préchargement lancé', {
        description: 'Le cache est en cours de préchargement',
      });
      // Refetch metrics after warmup
      setTimeout(() => refetch(), 2000); // Wait 2s for warmup to complete
    },
    onError: (error) => {
      console.error('Failed to warmup cache:', error);
      toast.error('Erreur', {
        description: 'Impossible de lancer le préchargement',
      });
    },
  });

  // Control polling
  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  // Auto-stop polling when component unmounts
  useEffect(() => {
    return () => {
      setIsPolling(false);
    };
  }, []);

  // Calculate derived metrics
  const hitRate = metrics?.cache 
    ? (metrics.cache.hits / (metrics.cache.totalRequests || 1)) * 100
    : 0;

  const memoryUsagePercent = metrics?.memory?.usagePercentage || 0;

  return {
    // Data
    metrics,
    cache: metrics?.cache,
    memory: metrics?.memory,
    hitRate,
    memoryUsagePercent,
    
    // States
    isLoading,
    error,
    isPolling,
    
    // Actions
    refetch,
    clearCache: clearCacheMutation.mutate,
    forceWarmup: forceWarmupMutation.mutate,
    startPolling,
    stopPolling,
    
    // Mutation states
    isClearing: clearCacheMutation.isPending,
    isWarmingUp: forceWarmupMutation.isPending,
  };
}

// Hook for entity-specific metrics
export function useEntityMetrics(entityType: string) {
  const { metrics, hitRate: parentHitRate, ...rest } = useCacheMetrics();
  
  const entityMetrics = metrics?.cache?.entityMetrics?.[entityType];
  
  return {
    metrics: entityMetrics,
    hitRate: entityMetrics 
      ? (entityMetrics.hits / (entityMetrics.requests || 1)) * 100
      : 0,
    avgResponseTime: entityMetrics?.avgResponseTime || 0,
    ...rest,
  };
}