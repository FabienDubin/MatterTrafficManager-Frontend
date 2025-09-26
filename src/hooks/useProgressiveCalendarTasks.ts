import { useCallback, useEffect, useRef, useState, MutableRefObject } from 'react';
import { tasksService } from '@/services/api/tasks.service';
import { Task } from '@/types/task.types';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

interface UseProgressiveCalendarTasksOptions {
  enablePolling?: boolean;
  pollingInterval?: number; // in milliseconds
}

interface UseProgressiveCalendarTasksReturn {
  tasks: Task[];
  isLoadingBackground: boolean;
  error: Error | null;
  loadedRanges: Array<{ start: Date; end: Date }>;
  fetchAdditionalRange: (start: Date, end: Date) => Promise<void>;
  clearCache: () => void;
  lastRefresh: Date | null;
  nextRefresh: Date | null;
  // Exposed for optimistic updates integration
  tasksMapRef: MutableRefObject<Map<string, Task>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  refreshAllRanges: () => Promise<void>;
}

/**
 * Hook for progressive loading of calendar tasks
 * Maintains all loaded tasks in memory and fetches additional ranges on demand
 * Supports automatic refresh with polling
 */
export function useProgressiveCalendarTasks(
  options: UseProgressiveCalendarTasksOptions = {}
): UseProgressiveCalendarTasksReturn {
  const { 
    enablePolling = true,
    pollingInterval = 2 * 60 * 1000 // Default: 2 minutes when active
  } = options;

  // Polling intervals
  const ACTIVE_INTERVAL = pollingInterval; // 2 minutes when active
  const INACTIVE_INTERVAL = 10 * 60 * 1000; // 10 minutes when inactive
  const REACTIVATION_THRESHOLD = 2 * 60 * 1000; // 2 minutes - refresh if inactive for this long

  // Map to store all tasks by ID for efficient deduplication
  const tasksMapRef = useRef<Map<string, Task>>(new Map());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingBackground, setIsLoadingBackground] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [loadedRanges, setLoadedRanges] = useState<Array<{ start: Date; end: Date }>>([]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [nextRefresh, setNextRefresh] = useState<Date | null>(null);
  
  // Track ongoing fetches to prevent duplicate requests
  const ongoingFetchesRef = useRef<Set<string>>(new Set());
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<Date>(new Date());
  const isTabActiveRef = useRef<boolean>(true);

  /**
   * Create a unique key for a date range
   */
  const getRangeKey = (start: Date, end: Date): string => {
    return `${format(start, 'yyyy-MM-dd')}_${format(end, 'yyyy-MM-dd')}`;
  };

  /**
   * Check if a range is already loaded or being loaded
   */
  const isRangeLoaded = useCallback((start: Date, end: Date): boolean => {
    const key = getRangeKey(start, end);
    if (ongoingFetchesRef.current.has(key)) {
      return true; // Consider as loaded if fetch is in progress
    }
    
    // Check if this range overlaps with any loaded range
    return loadedRanges.some(range => {
      // Range is considered loaded if it overlaps significantly
      return start >= range.start && end <= range.end;
    });
  }, [loadedRanges]);

  /**
   * Fetch tasks for a specific date range and merge with existing
   */
  const fetchAdditionalRange = useCallback(async (start: Date, end: Date, forceRefresh = false) => {
    const rangeKey = getRangeKey(start, end);
    
    // Prevent duplicate fetches
    if (!forceRefresh && ongoingFetchesRef.current.has(rangeKey)) {
      console.log('[Progressive] Fetch already in progress for', rangeKey);
      return;
    }
    
    // Check if range is already loaded (skip check if forcing refresh)
    if (!forceRefresh && isRangeLoaded(start, end)) {
      console.log('[Progressive] Range already loaded', rangeKey);
      return;
    }

    ongoingFetchesRef.current.add(rangeKey);
    setIsLoadingBackground(true);
    setError(null);

    // Start time to ensure minimum visible duration
    const startTime = Date.now();

    try {
      const formattedStartDate = format(start, 'yyyy-MM-dd');
      const formattedEndDate = format(end, 'yyyy-MM-dd');
      
      console.log('[Progressive] Fetching range:', formattedStartDate, 'to', formattedEndDate);
      const response = await tasksService.getCalendarTasks(formattedStartDate, formattedEndDate);

      if (response.success) {
        // Merge new tasks with existing ones
        response.data.tasks.forEach(task => {
          tasksMapRef.current.set(task.id, task);
        });
        
        // Update tasks array from map
        const allTasks = Array.from(tasksMapRef.current.values());
        setTasks(allTasks);
        
        // Track this loaded range
        setLoadedRanges(prev => {
          // Merge overlapping ranges
          const newRanges = [...prev, { start, end }];
          return mergeOverlappingRanges(newRanges);
        });
        
        // Update last refresh time
        setLastRefresh(new Date());
        
        console.log(`[Progressive] Loaded ${response.data.tasks.length} tasks, total: ${allTasks.length}`);
      } else {
        throw new Error('Failed to fetch calendar tasks');
      }
    } catch (err) {
      console.error('[Progressive] Error fetching range:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      
      // Show error toast only for user-initiated actions
      if (!isLoadingBackground) {
        toast.error("Erreur", {
          description: "Impossible de charger les tâches pour cette période",
        });
      }
    } finally {
      // Ensure minimum visible duration for loading state (300ms)
      const elapsed = Date.now() - startTime;
      if (elapsed < 300) {
        await new Promise(resolve => setTimeout(resolve, 300 - elapsed));
      }
      
      ongoingFetchesRef.current.delete(rangeKey);
      setIsLoadingBackground(false);
    }
  }, [isRangeLoaded]);

  /**
   * Refresh all loaded ranges (for polling)
   */
  const refreshAllRanges = useCallback(async () => {
    if (loadedRanges.length === 0) return;
    
    console.log('[Progressive] Refreshing all loaded ranges...');
    
    // DON'T clear visible tasks - keep them displayed during refresh
    // We'll replace them when new data arrives
    
    // Create a new map for fresh data
    const newTasksMap = new Map<string, Task>();
    
    // Clear the ongoing fetches to force new requests
    ongoingFetchesRef.current.clear();
    
    // Refresh each loaded range with forceRefresh flag
    for (const range of loadedRanges) {
      // Temporarily swap the map reference to collect fresh data
      const originalMap = tasksMapRef.current;
      tasksMapRef.current = newTasksMap;
      
      await fetchAdditionalRange(range.start, range.end, true); // Force refresh
      
      // Restore original map reference (will be updated below)
      tasksMapRef.current = originalMap;
    }
    
    // Now replace all data at once with the fresh data
    tasksMapRef.current = newTasksMap;
    setTasks(Array.from(newTasksMap.values()));
  }, [loadedRanges, fetchAdditionalRange]);

  /**
   * Schedule next polling
   */
  const scheduleNextPoll = useCallback(() => {
    if (!enablePolling) return;
    
    // Clear existing timeout
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
    }
    
    // Determine interval based on tab activity
    const interval = isTabActiveRef.current ? ACTIVE_INTERVAL : INACTIVE_INTERVAL;
    const nextTime = new Date(Date.now() + interval);
    setNextRefresh(nextTime);
    
    pollingTimeoutRef.current = setTimeout(() => {
      refreshAllRanges();
      scheduleNextPoll(); // Reschedule
    }, interval);
    
    console.log(`[Progressive] Next refresh scheduled in ${interval / 1000}s (${isTabActiveRef.current ? 'active' : 'inactive'} mode)`);
  }, [enablePolling, ACTIVE_INTERVAL, INACTIVE_INTERVAL, refreshAllRanges]);

  /**
   * Handle tab visibility change
   */
  useEffect(() => {
    if (!enablePolling) return;
    
    const handleVisibilityChange = () => {
      const wasActive = isTabActiveRef.current;
      isTabActiveRef.current = !document.hidden;
      
      if (!wasActive && isTabActiveRef.current) {
        // Tab became active
        const inactiveDuration = Date.now() - lastActivityRef.current.getTime();
        
        if (inactiveDuration >= REACTIVATION_THRESHOLD) {
          // Inactive for 2+ minutes, refresh immediately (but smoothly)
          console.log('[Progressive] Tab reactivated after', Math.round(inactiveDuration / 1000), 'seconds - smooth refresh now');
          refreshAllRanges(); // This now keeps UI stable during refresh
        }
        
        // Reschedule with active interval
        scheduleNextPoll();
      } else if (wasActive && !isTabActiveRef.current) {
        // Tab became inactive
        lastActivityRef.current = new Date();
        // Reschedule with inactive interval
        scheduleNextPoll();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enablePolling, REACTIVATION_THRESHOLD, refreshAllRanges, scheduleNextPoll]);

  /**
   * Initial load: current view + margins
   */
  useEffect(() => {
    const now = new Date();
    const initialStart = addDays(now, -30);
    const initialEnd = addDays(now, 30);
    
    fetchAdditionalRange(initialStart, initialEnd).then(() => {
      // Start polling after initial load
      if (enablePolling) {
        scheduleNextPoll();
      }
    });
  }, []); // Run once on mount
  
  /**
   * Cleanup polling on unmount
   */
  useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Clear all cached data
   */
  const clearCache = useCallback(() => {
    tasksMapRef.current.clear();
    setTasks([]);
    setLoadedRanges([]);
    ongoingFetchesRef.current.clear();
  }, []);

  return {
    tasks,
    isLoadingBackground,
    error,
    loadedRanges,
    fetchAdditionalRange,
    clearCache,
    lastRefresh,
    nextRefresh,
    // Expose internals for optimistic updates
    tasksMapRef,
    setTasks,
    refreshAllRanges
  };
}

/**
 * Merge overlapping date ranges
 */
function mergeOverlappingRanges(ranges: Array<{ start: Date; end: Date }>): Array<{ start: Date; end: Date }> {
  if (ranges.length <= 1) return ranges;
  
  // Sort ranges by start date
  const sorted = [...ranges].sort((a, b) => a.start.getTime() - b.start.getTime());
  
  const merged: Array<{ start: Date; end: Date }> = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    
    // Check if ranges overlap or are adjacent (within 1 day)
    if (current.start <= addDays(last.end, 1)) {
      // Merge by extending the end date if necessary
      last.end = new Date(Math.max(last.end.getTime(), current.end.getTime()));
    } else {
      // No overlap, add as new range
      merged.push(current);
    }
  }
  
  return merged;
}