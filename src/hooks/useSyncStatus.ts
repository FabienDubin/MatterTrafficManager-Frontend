import { useQuery } from '@tanstack/react-query';
import { syncService, SyncStatus } from '../services/api/sync.service';
import { useAuth } from '../providers/AuthProvider';

interface UseSyncStatusOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export const useSyncStatus = (options: UseSyncStatusOptions = {}) => {
  const { user } = useAuth();
  
  const {
    data,
    isLoading,
    error,
    refetch,
    dataUpdatedAt
  } = useQuery({
    queryKey: ['sync-status'],
    queryFn: async () => {
      const response = await syncService.getStatus();
      if (!response.success) {
        // Pass along network error info
        const err = new Error(response.error || 'Failed to fetch sync status') as any;
        err.isNetworkError = response.meta?.isNetworkError;
        throw err;
      }
      return response.data;
    },
    enabled: options.enabled !== false && !!user,
    refetchInterval: options.refetchInterval || 5000, // Poll every 5 seconds by default
    refetchIntervalInBackground: true,
    retry: 1, // Don't retry too much when server is down
    retryDelay: 1000 // Wait 1 second before retry
  });

  // Helper functions
  const clearQueue = async () => {
    const response = await syncService.clearQueue();
    if (response.success) {
      await refetch();
    }
    return response;
  };

  const retryFailed = async () => {
    const response = await syncService.retryFailed();
    if (response.success) {
      await refetch();
    }
    return response;
  };

  // Computed properties
  const hasIssues = data ? (data.failed > 0 || data.conflicts > 0) : false;
  const isIdle = data?.status === 'idle';
  const isSyncing = data?.status === 'syncing';
  const hasConflicts = data ? data.conflicts > 0 : false;
  const hasErrors = data ? data.failed > 0 : false;
  const isServerDown = error ? (error as any).isNetworkError === true : false;
  // Check if data is stale (more than 10 seconds old)
  const isDataStale = dataUpdatedAt ? Date.now() - dataUpdatedAt > 10000 : false;

  return {
    syncStatus: data as SyncStatus | undefined,
    isLoading,
    error,
    refetch,
    clearQueue,
    retryFailed,
    // Computed properties
    hasIssues,
    isIdle,
    isSyncing,
    hasConflicts,
    hasErrors,
    isServerDown,
    isDataStale
  };
};