import { useState } from 'react';
import { Task } from '@/types/task.types';
import { useOptimisticTaskDelete } from '@/hooks/useOptimisticTaskDelete';

interface BlacklistOptions {
  addToDeleteBlacklist?: (id: string) => void;
  removeFromDeleteBlacklist?: (id: string) => void;
}

/**
 * Hook for managing task operations in calendar
 */
export const useCalendarTaskManagement = (
  taskUpdate: any,
  tasksMapRef: any,
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  blacklistOptions?: BlacklistOptions
) => {
  const tasks = Array.from(tasksMapRef.current?.values() || []) as Task[];
  // État pour le sheet d'édition
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Initialize optimistic delete hook with blacklist support
  const taskDelete = useOptimisticTaskDelete(tasks, setTasks, {
    tasksMapRef,
    addToDeleteBlacklist: blacklistOptions?.addToDeleteBlacklist,
    removeFromDeleteBlacklist: blacklistOptions?.removeFromDeleteBlacklist,
  });

  // Handlers pour le sheet d'édition - Use optimistic updates
  const handleTaskUpdate = async (id: string, data: Partial<Task>) => {
    // Use optimistic update for INSTANT UI feedback
    // No need to await - the update is immediate in the UI
    taskUpdate.mutate({
      id,
      updates: data,
    });
    // That's it! No refresh needed - polling handles sync every 2 min
  };

  const handleTaskDelete = async (id: string) => {
    // Use optimistic delete with blacklist protection
    taskDelete.mutate({ id });
  };

  return {
    selectedTask,
    setSelectedTask,
    sheetOpen,
    setSheetOpen,
    handleTaskUpdate,
    handleTaskDelete,
  };
};