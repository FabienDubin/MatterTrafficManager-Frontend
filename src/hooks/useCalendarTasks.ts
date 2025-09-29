import { useEffect, useState } from 'react';
import { tasksService } from '@/services/api/tasks.service';
import { Task, CalendarTasksResponse } from '@/types/task.types';
import { format } from 'date-fns';

interface UseCalendarTasksParams {
  startDate: Date;
  endDate: Date;
  enabled?: boolean;
}

interface UseCalendarTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  error: Error | null;
  cacheHit: boolean;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch tasks for calendar view
 * Handles loading state, error state, and automatic refetch on date change
 */
export function useCalendarTasks({
  startDate,
  endDate,
  enabled = true,
}: UseCalendarTasksParams): UseCalendarTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [cacheHit, setCacheHit] = useState(false);

  const fetchTasks = async () => {
    if (!enabled) {return;}

    try {
      setIsLoading(true);
      setError(null);

      // Format dates to YYYY-MM-DD format
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');

      const response = await tasksService.getCalendarTasks(formattedStartDate, formattedEndDate);

      if (response.success) {
        setTasks(response.data.tasks);
        setCacheHit(response.data.cacheHit);
      } else {
        throw new Error('Failed to fetch calendar tasks');
      }
    } catch (err) {
      console.error('Error in useCalendarTasks:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      // Keep existing tasks on error
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tasks when dates change or enabled changes
  useEffect(() => {
    fetchTasks();
  }, [startDate.getTime(), endDate.getTime(), enabled]);
  
  // Log pour debug des changements de période
  useEffect(() => {
    console.log('[useCalendarTasks] Date range changed:', {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    });
  }, [startDate, endDate]);

  return {
    tasks,
    isLoading,
    error,
    cacheHit,
    refetch: fetchTasks,
  };
}

/**
 * Hook for current week tasks
 */
export function useCurrentWeekTasks() {
  const now = new Date();
  // Lundi à 00:00:00
  const startOfWeek = new Date(now);
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Ajuster si dimanche
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  // Dimanche à 23:59:59
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return useCalendarTasks({
    startDate: startOfWeek,
    endDate: endOfWeek,
  });
}

/**
 * Hook for current month tasks
 */
export function useCurrentMonthTasks() {
  const now = new Date();
  // Premier jour du mois à 00:00:00
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Dernier jour du mois à 23:59:59
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  return useCalendarTasks({
    startDate: startOfMonth,
    endDate: endOfMonth,
  });
}
