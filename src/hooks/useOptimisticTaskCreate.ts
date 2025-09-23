/**
 * Hook for optimistic task creation in the calendar
 * Provides immediate UI feedback when creating new tasks
 */

import { useOptimisticUpdate } from './useOptimisticUpdate';
import { tasksService, Task } from '@/services/api/tasks.service';
import { useCallback, useRef, MutableRefObject } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface TaskCreatePayload {
  title: string;
  workPeriod: {
    startDate: string;
    endDate: string;
  };
  assignedMembers?: string[];
  projectId?: string;
  clientId?: string;
  teams?: string[];
  status?: string;
  description?: string;
  notes?: string;
  taskType?: 'task' | 'holiday' | 'remote';
}

interface UseOptimisticTaskCreateOptions {
  // Reference to the internal tasks map from useProgressiveCalendarTasks
  tasksMapRef?: MutableRefObject<Map<string, Task>>;
  // Function to trigger a smooth refresh after successful mutation
  onMutationSuccess?: () => void;
}

/**
 * Hook for optimistic task creation with calendar integration
 * 
 * FLOW:
 * 1. User creates task → UI shows it IMMEDIATELY with temp ID
 * 2. API call happens in background
 * 3. On success → Replace temp ID with real ID from server
 * 4. On error → Remove the temporary task
 */
export function useOptimisticTaskCreate(
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  options: UseOptimisticTaskCreateOptions = {}
) {
  const { tasksMapRef, onMutationSuccess } = options;
  
  // Keep track of temporary tasks for cleanup
  const tempTasksRef = useRef<Map<string, Task>>(new Map());

  const createTask = useOptimisticUpdate<Task, TaskCreatePayload>({
    mutationKey: ['create-task'],
    
    mutationFn: async (payload) => {
      // Call the backend API
      return await tasksService.createTask(payload);
    },
    
    onOptimisticUpdate: (payload) => {
      // Generate temporary ID for immediate display
      const tempId = `temp-${uuidv4()}`;
      
      // Create temporary task with all provided data
      const tempTask: Task = {
        id: tempId,
        title: payload.title,
        workPeriod: payload.workPeriod,
        assignedMembers: payload.assignedMembers || [],
        projectId: payload.projectId,
        clientId: payload.clientId,
        teams: payload.teams || [],
        status: payload.status || 'not_started',
        description: payload.description,
        notes: payload.notes,
        taskType: payload.taskType || 'task',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        
        // These will be populated when server responds
        assignedMembersData: [],
        projectData: undefined,
        clientData: undefined,
        teamsData: [],
        involvedTeamIds: [],
        involvedTeamsData: []
      };
      
      // Save temp task for later cleanup
      tempTasksRef.current.set(tempId, tempTask);
      
      // IMMEDIATE UPDATE #1: Add to internal map
      if (tasksMapRef?.current) {
        tasksMapRef.current.set(tempId, tempTask);
      }
      
      // IMMEDIATE UPDATE #2: Add to React state (user sees this instantly!)
      setTasks(prevTasks => [...prevTasks, tempTask]);
      
      // Return temp ID as context for later use
      return tempId;
    },
    
    onError: (error, payload, tempId) => {
      if (typeof tempId === 'string') {
        // Remove temporary task on error
        tempTasksRef.current.delete(tempId);
        
        // Remove from internal map
        if (tasksMapRef?.current) {
          tasksMapRef.current.delete(tempId);
        }
        
        // Remove from React state
        setTasks(prevTasks => prevTasks.filter(task => task.id !== tempId));
      }
    },
    
    onSuccess: (data, payload, tempId) => {
      if (typeof tempId === 'string') {
        // Remove temp task
        tempTasksRef.current.delete(tempId);
        
        // Replace temp task with real task from server
        if (tasksMapRef?.current) {
          tasksMapRef.current.delete(tempId);
          tasksMapRef.current.set(data.id, data);
        }
        
        // Replace in React state
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === tempId ? data : task
          )
        );
        
        // Trigger smooth refresh to ensure consistency
        if (onMutationSuccess) {
          setTimeout(() => {
            onMutationSuccess();
          }, 1000);
        }
      }
    },
    
    queryKeysToInvalidate: [], // We're not using React Query cache
    
    toastMessages: {
      loading: 'Création de la tâche...',
      success: 'Tâche créée avec succès',
      error: 'Erreur lors de la création'
    },
    
    showToast: true
  });
  
  // Helper to check if a task is temporary
  const isTaskTemporary = useCallback((taskId: string) => {
    return taskId.startsWith('temp-');
  }, []);
  
  // Helper to get all temporary tasks
  const getTemporaryTasks = useCallback(() => {
    return Array.from(tempTasksRef.current.values());
  }, []);
  
  return {
    ...createTask,
    isTaskTemporary,
    getTemporaryTasks,
    hasTemporaryTasks: tempTasksRef.current.size > 0
  };
}

/**
 * Hook for quick task creation with minimal required fields
 */
export function useQuickTaskCreate(
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  options: UseOptimisticTaskCreateOptions = {}
) {
  const { mutate, mutateAsync } = useOptimisticTaskCreate(tasks, setTasks, options);
  
  const quickCreate = useCallback(
    (title: string, startDate: string, endDate: string, assignedMembers?: string[]) => {
      return mutate({
        title,
        workPeriod: { startDate, endDate },
        assignedMembers: assignedMembers || [],
        status: 'not_started'
      });
    },
    [mutate]
  );
  
  const quickCreateAsync = useCallback(
    (title: string, startDate: string, endDate: string, assignedMembers?: string[]) => {
      return mutateAsync({
        title,
        workPeriod: { startDate, endDate },
        assignedMembers: assignedMembers || [],
        status: 'not_started'
      });
    },
    [mutateAsync]
  );
  
  return {
    quickCreate,
    quickCreateAsync
  };
}