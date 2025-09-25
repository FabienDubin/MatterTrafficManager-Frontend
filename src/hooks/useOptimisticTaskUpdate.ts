/**
 * Hook for optimistic task updates in the calendar
 * Provides IMMEDIATE UI updates with seamless polling integration
 */

import { useOptimisticUpdate } from './useOptimisticUpdate';
import { tasksService, Task } from '@/services/api/tasks.service';
import { useCallback, useRef, MutableRefObject } from 'react';
import { toast } from 'sonner';

export interface TaskUpdatePayload {
  id: string;
  updates: Partial<{
    title: string;
    workPeriod: {
      startDate: string;
      endDate: string;
    };
    assignedMembers: string[];
    assignedMembersData?: Array<{
      id: string;
      name: string;
      email: string;
      teams?: string[];
    }>;
    projectId: string;
    projectData?: {
      id: string;
      name: string;
      status: string;
    };
    clientId: string;
    clientData?: {
      id: string;
      name: string;
    };
    teams: string[];
    teamsData?: Array<{
      id: string;
      name: string;
    }>;
    status: string;
    description: string;
    notes: string;
  }>;
}

interface UseOptimisticTaskUpdateOptions {
  // Reference to the internal tasks map from useProgressiveCalendarTasks
  tasksMapRef?: MutableRefObject<Map<string, Task>>;
  // Function to trigger a smooth refresh after successful mutation
  onMutationSuccess?: () => void;
}

/**
 * Hook for optimistic task updates with calendar integration
 * 
 * FLOW:
 * 1. User makes change → UI updates IMMEDIATELY (0ms)
 * 2. API call happens in background
 * 3. On success → Smooth refresh to sync any other changes from Notion
 * 4. On error → Rollback to original state
 * 
 * The polling continues normally and won't override optimistic updates
 * because we also update the internal tasksMapRef.
 */
export function useOptimisticTaskUpdate(
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  options: UseOptimisticTaskUpdateOptions = {}
) {
  const { tasksMapRef, onMutationSuccess } = options;
  
  // Keep track of original tasks for rollback
  const originalTasksRef = useRef<Map<string, Task>>(new Map());
  // Track which tasks have pending updates (to show sync indicator)
  const pendingUpdatesRef = useRef<Set<string>>(new Set());

  const updateTask = useOptimisticUpdate<Task, TaskUpdatePayload>({
    mutationKey: ['update-task'],
    
    mutationFn: async ({ id, updates }) => {
      // Call the backend API
      const response = await tasksService.updateTask(id, updates);
      
      // Check for conflicts in the response
      if (response && 'conflicts' in response && (response as any).conflicts?.length > 0) {
        const conflicts = (response as any).conflicts;
        console.warn('🚨 CONFLITS DÉTECTÉS lors de la mise à jour:', {
          taskId: id,
          conflicts: conflicts,
          conflictCount: conflicts.length
        });
        
        // Log each conflict type for debugging
        conflicts.forEach((conflict: any) => {
          console.warn(`⚠️ Conflit ${conflict.type}:`, {
            type: conflict.type,
            message: conflict.message,
            details: conflict.details
          });
        });
      }
      
      return response;
    },
    
    onOptimisticUpdate: ({ id, updates }) => {
      // Mark task as having pending update
      pendingUpdatesRef.current.add(id);
      
      // Save original task for potential rollback
      const originalTask = tasks.find(t => t.id === id);
      
      if (originalTask) {
        originalTasksRef.current.set(id, { ...originalTask });
      }
      
      // Create updated task - THIS IS IMMEDIATE!
      // Merge only the provided updates with the original task
      const updatedTask = originalTask 
        ? {
            ...originalTask,
            ...updates,
            updatedAt: new Date().toISOString()
          }
        : null;
      
      if (updatedTask) {
        // IMMEDIATE UPDATE #1: Update the internal map (survives polling)
        if (tasksMapRef?.current) {
          tasksMapRef.current.set(id, updatedTask);
        }
        
        // IMMEDIATE UPDATE #2: Update React state (user sees this instantly!)
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === id ? updatedTask : task
          )
        );
      }
    },
    
    onError: (error, { id }) => {
      // Remove from pending
      pendingUpdatesRef.current.delete(id);
      
      // Rollback to original task
      const originalTask = originalTasksRef.current.get(id);
      if (originalTask) {
        // Restore in internal map
        if (tasksMapRef?.current) {
          tasksMapRef.current.set(id, originalTask);
        }
        
        // Restore in component state
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === id ? originalTask : task
          )
        );
      }
      
      // Error handling is done by useOptimisticUpdate (toast with retry)
    },
    
    onSuccess: (data, { id }) => {
      // Remove from pending
      pendingUpdatesRef.current.delete(id);
      
      // Clear the original task from ref
      originalTasksRef.current.delete(id);
      
      // Check if response has _pendingSync flag (async mode indicator)
      const isAsyncResponse = data && '_pendingSync' in data;
      
      if (!isAsyncResponse && data) {
        // SYNC mode: Update with fresh server data (complete task from Notion)
        if (tasksMapRef?.current) {
          tasksMapRef.current.set(id, data);
        }
        
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === id ? data : task
          )
        );
      }
      // ASYNC mode: Keep our optimistic update, don't replace with incomplete data
      // The polling will bring the real data from Notion later
      
      // Optional: Trigger callback if provided
      if (onMutationSuccess) {
        onMutationSuccess();
      }
    },
    
    queryKeysToInvalidate: [], // We're not using React Query cache
    
    toastMessages: {
      loading: 'Synchronisation...', // Brief message since update is instant
      success: 'Modification enregistrée',
      error: 'Erreur de synchronisation'
    },
    
    showToast: true // Show toasts for feedback
  });
  
  // Helper to check if a task has pending updates
  const isTaskPending = useCallback((taskId: string) => {
    return pendingUpdatesRef.current.has(taskId);
  }, []);
  
  return {
    ...updateTask,
    isTaskPending,
    hasPendingUpdates: pendingUpdatesRef.current.size > 0
  };
}

/**
 * Hook for quick date/time updates (most common calendar operation)
 * NOTE: This hook needs to be used within a component that has access to tasks and setTasks
 */
export function useOptimisticTaskDateUpdate(
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  options: UseOptimisticTaskUpdateOptions = {}
) {
  const { mutate, mutateAsync, syncState, isPending } = useOptimisticTaskUpdate(tasks, setTasks, options);
  
  const updateTaskDates = useCallback(
    (taskId: string, startDate: string, endDate: string) => {
      return mutate({
        id: taskId,
        updates: {
          workPeriod: { startDate, endDate }
        }
      });
    },
    [mutate]
  );
  
  const updateTaskDatesAsync = useCallback(
    (taskId: string, startDate: string, endDate: string) => {
      return mutateAsync({
        id: taskId,
        updates: {
          workPeriod: { startDate, endDate }
        }
      });
    },
    [mutateAsync]
  );
  
  return {
    updateTaskDates,
    updateTaskDatesAsync,
    isSyncing: syncState.isSyncing || isPending,
    syncError: syncState.syncError
  };
}

/**
 * Hook for quick assignee updates
 */
export function useOptimisticTaskAssigneeUpdate(
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  options: UseOptimisticTaskUpdateOptions = {}
) {
  const { mutate, mutateAsync, syncState, isPending } = useOptimisticTaskUpdate(tasks, setTasks, options);
  
  const updateTaskAssignees = useCallback(
    (taskId: string, assignedMembers: string[]) => {
      return mutate({
        id: taskId,
        updates: { assignedMembers }
      });
    },
    [mutate]
  );
  
  const updateTaskAssigneesAsync = useCallback(
    (taskId: string, assignedMembers: string[]) => {
      return mutateAsync({
        id: taskId,
        updates: { assignedMembers }
      });
    },
    [mutateAsync]
  );
  
  return {
    updateTaskAssignees,
    updateTaskAssigneesAsync,
    isSyncing: syncState.isSyncing || isPending,
    syncError: syncState.syncError
  };
}

/**
 * Hook for batch task updates (multiple fields at once)
 */
export function useOptimisticTaskBatchUpdate(
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  options: UseOptimisticTaskUpdateOptions = {}
) {
  const { mutate, syncState, isPending } = useOptimisticTaskUpdate(tasks, setTasks, options);
  
  const batchUpdateTask = useCallback(
    (taskId: string, updates: TaskUpdatePayload['updates']) => {
      // Show specific toast based on what's being updated
      const updatedFields = Object.keys(updates);
      let toastMessage = 'Mise à jour: ';
      
      if (updatedFields.includes('workPeriod')) toastMessage += 'dates, ';
      if (updatedFields.includes('assignedMembers')) toastMessage += 'assignés, ';
      if (updatedFields.includes('status')) toastMessage += 'statut, ';
      if (updatedFields.includes('title')) toastMessage += 'titre, ';
      
      toastMessage = toastMessage.slice(0, -2); // Remove trailing comma
      
      toast.info(toastMessage, {
        duration: 2000
      });
      
      return mutate({
        id: taskId,
        updates
      });
    },
    [mutate]
  );
  
  return {
    batchUpdateTask,
    isSyncing: syncState.isSyncing || isPending,
    syncError: syncState.syncError
  };
}