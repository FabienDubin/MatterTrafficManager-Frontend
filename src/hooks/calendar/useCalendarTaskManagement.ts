import { useState } from 'react';
import { tasksService } from '@/services/api/tasks.service';
import { Task } from '@/types/task.types';

/**
 * Hook for managing task operations in calendar
 */
export const useCalendarTaskManagement = (
  taskUpdate: any,
  tasksMapRef: any,
  setTasks: (updater: (tasks: Task[]) => Task[]) => void
) => {
  // État pour le sheet d'édition
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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
    try {
      // For delete, we still call the service directly
      // TODO: Create optimistic delete hook if needed
      await tasksService.deleteTask(id);

      // Remove from local state immediately for better UX
      tasksMapRef.current.delete(id);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));

      // No full refresh - let polling handle any other changes
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
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