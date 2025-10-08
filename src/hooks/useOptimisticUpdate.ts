/**
 * Generic hook for optimistic updates with TanStack Query
 * Provides immediate UI updates with automatic rollback on error
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCallback, useState, useEffect } from 'react';

export interface OptimisticUpdateOptions<TData, TVariables, TContext = unknown> {
  mutationKey?: string[];
  mutationFn: (variables: TVariables) => Promise<TData>;
  onOptimisticUpdate?: (variables: TVariables) => void;
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void;
  onError?: (error: Error, variables: TVariables, context: TContext | undefined) => void;
  onSettled?: () => void;
  queryKeysToInvalidate?: string[][];
  showToast?: boolean;
  toastMessages?: {
    loading?: string;
    success?: string;
    error?: string;
  };
}

export interface OptimisticUpdateState {
  isSyncing: boolean;
  syncError: Error | null;
  lastSyncAt: Date | null;
}

/**
 * Generic hook for optimistic updates
 */
export function useOptimisticUpdate<TData = unknown, TVariables = void, TContext = unknown>(
  options: OptimisticUpdateOptions<TData, TVariables, TContext>
) {
  const queryClient = useQueryClient();
  const [syncState, setSyncState] = useState<OptimisticUpdateState>({
    isSyncing: false,
    syncError: null,
    lastSyncAt: null,
  });

  const {
    mutationKey = ['optimistic-update'],
    mutationFn,
    onOptimisticUpdate,
    onSuccess,
    onError,
    onSettled,
    queryKeysToInvalidate = [],
    showToast = true,
    toastMessages = {
      loading: 'Synchronisation...',
      success: 'Modifications enregistrées',
      error: 'Erreur de synchronisation',
    },
  } = options;

  const mutation = useMutation<TData, Error, TVariables, TContext>({
    mutationKey,
    mutationFn,
    
    onMutate: async (variables) => {
      // Set syncing state
      setSyncState(prev => ({ ...prev, isSyncing: true, syncError: null }));
      
      // Cancel outgoing refetches
      await Promise.all(
        queryKeysToInvalidate.map(key => queryClient.cancelQueries({ queryKey: key }))
      );
      
      // Perform optimistic update
      if (onOptimisticUpdate) {
        onOptimisticUpdate(variables);
      }
      
      // Create context for potential rollback
      const previousData: Record<string, unknown> = {};
      for (const key of queryKeysToInvalidate) {
        previousData[key.join('-')] = queryClient.getQueryData(key);
      }
      
      return previousData as TContext;
    },
    
    onSuccess: (data, variables, context) => {
      setSyncState({
        isSyncing: false,
        syncError: null,
        lastSyncAt: new Date(),
      });
      
      if (showToast) {
        toast.success(toastMessages.success);
      }
      
      if (onSuccess) {
        onSuccess(data, variables, context);
      }
    },
    
    onError: (error, variables, context) => {
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        syncError: error,
      }));
      
      // Rollback optimistic updates
      if (context) {
        const previousData = context as Record<string, unknown>;
        for (const key of queryKeysToInvalidate) {
          const dataKey = key.join('-');
          if (previousData[dataKey] !== undefined) {
            queryClient.setQueryData(key, previousData[dataKey]);
          }
        }
      }
      
      if (showToast) {
        // Check if it's a 403 permission error
        const isForbidden = (error as any).status === 403;

        if (isForbidden) {
          // For permission errors, show a warning without retry button
          toast.warning('Permission refusée', {
            description: error.message,
            duration: 5000, // Show longer for permission errors
          });
        } else {
          // For other errors, show error toast with retry button
          toast.error(toastMessages.error, {
            description: error.message,
            action: {
              label: 'Réessayer',
              onClick: () => mutation.mutate(variables),
            },
          });
        }
      }
      
      if (onError) {
        onError(error, variables, context);
      }
    },
    
    onSettled: () => {
      // Refetch affected queries
      queryKeysToInvalidate.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      
      if (onSettled) {
        onSettled();
      }
    },
  });

  const mutateAsync = useCallback(
    async (variables: TVariables) => {
      return mutation.mutateAsync(variables);
    },
    [mutation]
  );

  const mutate = useCallback(
    (variables: TVariables) => {
      mutation.mutate(variables);
    },
    [mutation]
  );

  return {
    mutate,
    mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
    syncState,
  };
}

/**
 * Hook to track global sync state across all optimistic updates
 */
export function useGlobalSyncState() {
  const queryClient = useQueryClient();
  const mutations = queryClient.getMutationCache().getAll();
  
  // Only track mutations related to tasks/sync operations
  // Exclude queries like status checks that might be retrying
  const relevantMutations = mutations.filter(m => {
    const mutationKey = m.options.mutationKey;
    // Check if it's a task-related mutation
    // mutationKey is an array like ['update-task'] or ['create-task']
    if (!mutationKey || !Array.isArray(mutationKey)) {return false;}
    
    const keyString = mutationKey.join('-');
    return (
      keyString.includes('task') || 
      keyString.includes('sync') ||
      keyString.includes('create') ||
      keyString.includes('update') ||
      keyString.includes('delete')
    );
  });
  
  const pendingMutations = relevantMutations.filter(m => m.state.status === 'pending');
  const isSyncing = pendingMutations.length > 0;
  const hasErrors = relevantMutations.some(m => m.state.status === 'error');
  
  return {
    isSyncing,
    hasErrors,
    pendingCount: pendingMutations.length,
  };
}

/**
 * Hook to detect online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connexion rétablie');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Mode hors ligne', {
        description: 'Les modifications seront synchronisées à la reconnexion',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}