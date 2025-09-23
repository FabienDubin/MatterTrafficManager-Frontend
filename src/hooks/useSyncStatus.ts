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
    refetch
  } = useQuery({
    queryKey: ['sync-status'],
    queryFn: async () => {
      const response = await syncService.getStatus();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch sync status');
      }
      return response.data;
    },
    enabled: options.enabled !== false && !!user,
    refetchInterval: options.refetchInterval || 5000, // Poll every 5 seconds by default
    refetchIntervalInBackground: true
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
    hasErrors
  };
};