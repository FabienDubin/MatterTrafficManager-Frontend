import { useEffect } from 'react';
import { useCalendarConfigStore } from '@/store/calendar-config.store';

/**
 * Hook to fetch and use calendar configuration
 * Automatically fetches config on mount if not already loaded
 */
export function useCalendarConfig() {
  const { config, isLoading, error, fetchConfig } = useCalendarConfigStore();

  useEffect(() => {
    // Fetch config only once on first mount if not already loaded
    if (!config && !isLoading) {
      fetchConfig();
    }
  }, []);

  return {
    config,
    isLoading,
    error,
    refetch: fetchConfig,
  };
}