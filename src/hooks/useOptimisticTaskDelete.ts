/**
 * Hook for optimistic task deletion in the calendar
 * Provides immediate UI feedback when deleting tasks
 */

import { useOptimisticUpdate } from './useOptimisticUpdate';
import { tasksService } from '@/services/api/tasks.service';
import { Task } from '@/types/task.types';
import { useCallback, useRef, MutableRefObject } from 'react';

export interface TaskDeletePayload {
  id: string;
}

interface UseOptimisticTaskDeleteOptions {
  // Reference to the internal tasks map from useProgressiveCalendarTasks
  tasksMapRef?: MutableRefObject<Map<string, Task>>;
  // Function to trigger a smooth refresh after successful mutation
  onMutationSuccess?: () => void;
  // Blacklist functions to prevent refresh from re-adding deleted tasks
  addToDeleteBlacklist?: (id: string) => void;
  removeFromDeleteBlacklist?: (id: string) => void;
}

/**
 * Hook for optimistic task deletion with calendar integration
 * 
 * FLOW:
 * 1. User deletes task → UI removes it IMMEDIATELY
 * 2. API call happens in background
 * 3. On success → Confirm deletion, refresh to sync
 * 4. On error → Restore the task (undo deletion)
 */
export function useOptimisticTaskDelete(
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  options: UseOptimisticTaskDeleteOptions = {}
) {
  const { tasksMapRef, onMutationSuccess, addToDeleteBlacklist, removeFromDeleteBlacklist } = options;
  
  // Keep deleted tasks for potential restoration
  const deletedTasksRef = useRef<Map<string, Task>>(new Map());

  const deleteTask = useOptimisticUpdate<void, TaskDeletePayload>({
    mutationKey: ['delete-task'],
    
    mutationFn: async ({ id }) => {
      // Call the backend API
      await tasksService.deleteTask(id);
    },
    
    onOptimisticUpdate: ({ id }) => {
      // Find and save the task before deletion (for potential rollback)
      const taskToDelete = tasks.find(t => t.id === id);
      if (taskToDelete) {
        deletedTasksRef.current.set(id, { ...taskToDelete });

        // CRITICAL: Add to blacklist FIRST to prevent refresh from re-adding
        if (addToDeleteBlacklist) {
          addToDeleteBlacklist(id);
        }

        // IMMEDIATE UPDATE #1: Remove from internal map
        if (tasksMapRef?.current) {
          tasksMapRef.current.delete(id);
        }

        // IMMEDIATE UPDATE #2: Remove from React state (disappears instantly!)
        setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
      }

      // Return the deleted task as context for rollback
      return taskToDelete;
    },
    
    onError: (_error, { id }, deletedTask) => {
      // Remove from blacklist to allow restoration
      if (removeFromDeleteBlacklist) {
        removeFromDeleteBlacklist(id);
      }

      // Restore the deleted task on error
      if (deletedTask && typeof deletedTask === 'object' && 'id' in deletedTask) {
        const taskToRestore = deletedTask as Task;

        // Restore in internal map
        if (tasksMapRef?.current) {
          tasksMapRef.current.set(id, taskToRestore);
        }

        // Restore in React state (task reappears)
        setTasks(prevTasks => {
          // Check if task doesn't already exist (avoid duplicates)
          if (!prevTasks.some(t => t.id === id)) {
            // Insert at original position if possible
            const allTasks = [...prevTasks, taskToRestore];
            // Sort by original creation date to maintain order
            return allTasks.sort((a, b) => {
              const dateA = new Date(a.createdAt || 0).getTime();
              const dateB = new Date(b.createdAt || 0).getTime();
              return dateA - dateB;
            });
          }
          return prevTasks;
        });
      }
    },
    
    onSuccess: (_, { id }) => {
      // Clear from deleted tasks cache
      deletedTasksRef.current.delete(id);

      // Remove from blacklist after successful deletion
      if (removeFromDeleteBlacklist) {
        removeFromDeleteBlacklist(id);
      }

      // Trigger smooth refresh to ensure consistency
      if (onMutationSuccess) {
        setTimeout(() => {
          onMutationSuccess();
        }, 1000);
      }
    },
    
    queryKeysToInvalidate: [], // We're not using React Query cache
    
    toastMessages: {
      loading: 'Suppression de la tâche...',
      success: 'Tâche supprimée avec succès',
      error: 'Erreur lors de la suppression'
    },
    
    showToast: true
  });
  
  // Helper to get recently deleted tasks (for undo functionality)
  const getDeletedTasks = useCallback(() => {
    return Array.from(deletedTasksRef.current.values());
  }, []);
  
  // Helper to restore a deleted task manually (advanced undo)
  const restoreDeletedTask = useCallback((taskId: string) => {
    const deletedTask = deletedTasksRef.current.get(taskId);
    if (deletedTask) {
      // Remove from blacklist to allow restoration
      if (removeFromDeleteBlacklist) {
        removeFromDeleteBlacklist(taskId);
      }

      // Restore in internal map
      if (tasksMapRef?.current) {
        tasksMapRef.current.set(taskId, deletedTask);
      }

      // Restore in React state
      setTasks(prevTasks => {
        if (!prevTasks.some(t => t.id === taskId)) {
          return [...prevTasks, deletedTask].sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateA - dateB;
          });
        }
        return prevTasks;
      });

      // Remove from deleted cache
      deletedTasksRef.current.delete(taskId);

      return true;
    }
    return false;
  }, [setTasks, tasksMapRef, removeFromDeleteBlacklist]);
  
  return {
    ...deleteTask,
    getDeletedTasks,
    restoreDeletedTask,
    hasDeletedTasks: deletedTasksRef.current.size > 0
  };
}

/**
 * Hook for batch task deletion (delete multiple tasks at once)
 */
export function useBatchTaskDelete(
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  options: UseOptimisticTaskDeleteOptions = {}
) {
  const { mutate } = useOptimisticTaskDelete(tasks, setTasks, options);
  
  const deleteTasks = useCallback(
    (taskIds: string[]) => {
      // Delete each task optimistically
      // They will all disappear immediately from UI
      taskIds.forEach(id => {
        mutate({ id });
      });
    },
    [mutate]
  );
  
  return {
    deleteTasks
  };
}