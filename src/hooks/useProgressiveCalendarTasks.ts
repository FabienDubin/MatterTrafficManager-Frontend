import { useCallback, useEffect, useRef, useState } from 'react';
import { tasksService, Task } from '@/services/api/tasks.service';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

interface UseProgressiveCalendarTasksReturn {
  tasks: Task[];
  isLoadingBackground: boolean;
  error: Error | null;
  loadedRanges: Array<{ start: Date; end: Date }>;
  fetchAdditionalRange: (start: Date, end: Date) => Promise<void>;
  clearCache: () => void;
}

/**
 * Hook for progressive loading of calendar tasks
 * Maintains all loaded tasks in memory and fetches additional ranges on demand
 */
export function useProgressiveCalendarTasks(): UseProgressiveCalendarTasksReturn {
  // Map to store all tasks by ID for efficient deduplication
  const tasksMapRef = useRef<Map<string, Task>>(new Map());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingBackground, setIsLoadingBackground] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [loadedRanges, setLoadedRanges] = useState<Array<{ start: Date; end: Date }>>([]);
  
  // Track ongoing fetches to prevent duplicate requests
  const ongoingFetchesRef = useRef<Set<string>>(new Set());

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
  const fetchAdditionalRange = useCallback(async (start: Date, end: Date) => {
    const rangeKey = getRangeKey(start, end);
    
    // Prevent duplicate fetches
    if (ongoingFetchesRef.current.has(rangeKey)) {
      console.log('[Progressive] Fetch already in progress for', rangeKey);
      return;
    }
    
    // Check if range is already loaded
    if (isRangeLoaded(start, end)) {
      console.log('[Progressive] Range already loaded', rangeKey);
      return;
    }

    ongoingFetchesRef.current.add(rangeKey);
    setIsLoadingBackground(true);
    setError(null);

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
      ongoingFetchesRef.current.delete(rangeKey);
      setIsLoadingBackground(false);
    }
  }, [isRangeLoaded]);

  /**
   * Initial load: current view + margins
   */
  useEffect(() => {
    const now = new Date();
    const initialStart = addDays(now, -30);
    const initialEnd = addDays(now, 30);
    
    fetchAdditionalRange(initialStart, initialEnd);
  }, []); // Run once on mount

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