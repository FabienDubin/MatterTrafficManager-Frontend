/**
 * Hook for optimistic task creation in the calendar
 * Provides immediate UI feedback when creating new tasks
 */

import { useOptimisticUpdate } from './useOptimisticUpdate';
import { tasksService } from '@/services/api/tasks.service';
import { Task } from '@/types/task.types';
import { useCallback, useRef, MutableRefObject } from 'react';

export interface TaskCreatePayload {
  // Champs obligatoires
  title: string;
  workPeriod: {
    startDate: string;
    endDate: string;
  };
  projectId: string;
  status: string;

  // Champs optionnels basiques
  assignedMembers?: string[];
  clientId?: string;
  teams?: string[];
  description?: string;
  notes?: string;
  taskType?: 'task' | 'holiday' | 'remote';
  addToCalendar?: boolean;

  // Données enrichies (depuis TaskEditSheet)
  projectData?: {
    id: string;
    name: string;
    status: string;
  };
  clientData?: {
    id: string;
    name: string;
  };
  assignedMembersData?: Array<{
    id: string;
    name: string;
    email: string;
    teams?: string[];
  }>;
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

  // Track original payloads for merge in onSuccess (preserve enriched data)
  const payloadBackupRef = useRef<Map<string, TaskCreatePayload>>(new Map());

  const createTask = useOptimisticUpdate<Task, TaskCreatePayload>({
    mutationKey: ['create-task'],
    
    mutationFn: async (payload) => {
      // Call the backend API
      const response = await tasksService.createTask(payload);
      
      // Check for conflicts in the response
      if (response && 'conflicts' in response && (response as any).conflicts?.length > 0) {
        const conflicts = (response as any).conflicts;
        console.warn('🚨 CONFLITS DÉTECTÉS lors de la création:', {
          newTask: payload.title,
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
    
    onOptimisticUpdate: (payload) => {
      // Generate temporary ID for immediate display (pattern backend)
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Save payload for merge in onSuccess (preserve enriched data)
      payloadBackupRef.current.set(tempId, payload);

      // Create temporary task with all provided data INCLUDING enriched data
      const tempTask: Task = {
        id: tempId,
        title: payload.title,
        workPeriod: payload.workPeriod,
        assignedMembers: payload.assignedMembers || [],
        projectId: payload.projectId,
        clientId: payload.clientId,
        teams: payload.teams || [],
        status: payload.status,
        description: payload.description,
        notes: payload.notes,
        taskType: payload.taskType || 'task',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),

        // USE enriched data from payload (from TaskEditSheet)
        assignedMembersData: payload.assignedMembersData || [],
        projectData: payload.projectData,
        clientData: payload.clientData,
        teamsData: [],
        involvedTeamIds: [],
        involvedTeamsData: [],
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
    
    onSuccess: (response, payload, tempId) => {
      if (!response || typeof tempId !== 'string') return;

      // Remove temp task from tracking
      tempTasksRef.current.delete(tempId);

      // Check if response is from async mode (has _pendingSync flag)
      const isAsyncResponse = response && '_pendingSync' in response;

      if (!isAsyncResponse && response) {
        // SYNC MODE or ASYNC RESOLVED
        // Backend returned the real Notion ID

        // 1. Get original payload for merging enriched data
        const originalPayload = payloadBackupRef.current.get(tempId);

        // 2. Merge backend response with enriched frontend data
        const mergedTask: Task = {
          ...response,
          // Preserve enriched data if missing from backend response
          projectData: response.projectData || originalPayload?.projectData,
          clientData: response.clientData || originalPayload?.clientData,
          assignedMembersData: response.assignedMembersData || originalPayload?.assignedMembersData,
        };

        // 3. Update tasksMapRef: remove temp, add real
        if (tasksMapRef?.current) {
          tasksMapRef.current.delete(tempId);
          tasksMapRef.current.set(response.id, mergedTask);
        }

        // 4. Update React state: replace temp with real (avoid duplicates)
        setTasks(prevTasks => {
          // Remove temp task
          const withoutTemp = prevTasks.filter(t => t.id !== tempId);
          // Check if real task already exists (async resolved case)
          const exists = withoutTemp.some(t => t.id === response.id);
          if (exists) {
            // Replace existing
            return withoutTemp.map(t => (t.id === response.id ? mergedTask : t));
          }
          // Add new
          return [...withoutTemp, mergedTask];
        });

        // 5. Cleanup
        payloadBackupRef.current.delete(tempId);

        // 6. Trigger smooth refresh to ensure consistency
        if (onMutationSuccess) {
          setTimeout(() => {
            onMutationSuccess();
          }, 1000);
        }
      }
      // ASYNC MODE: Keep optimistic task, polling will sync later
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