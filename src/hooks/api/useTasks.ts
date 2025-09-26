import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService } from '@/services/api/tasks.service';
import { Task } from '@/types/task.types';
import { toast } from 'sonner';

// Query keys
const TASKS_KEY = ['tasks'];
const TASK_KEY = (id: string) => ['task', id];

// Hook to fetch all tasks
export function useTasks() {
  return useQuery({
    queryKey: TASKS_KEY,
    queryFn: tasksService.getTasks,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 1,
  });
}

// Hook to fetch a single task
export function useTask(id: string) {
  return useQuery({
    queryKey: TASK_KEY(id),
    queryFn: () => tasksService.getTask(id),
    enabled: !!id,
  });
}

// Hook to test Notion connection
export function useNotionTest() {
  return useQuery({
    queryKey: ['notion-test'],
    queryFn: tasksService.testNotion,
    retry: false,
  });
}

// Hook to create a task
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tasksService.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      toast.success("Succès", {
        description: "Tâche créée avec succès",
      });
    },
    onError: (error: any) => {
      toast.error("Erreur", {
        description: error.message || "Impossible de créer la tâche",
      });
    },
  });
}

// Hook to update a task
export function useUpdateTask(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (task: Partial<Task>) => tasksService.updateTask(id, task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      queryClient.invalidateQueries({ queryKey: TASK_KEY(id) });
      toast.success("Succès", {
        description: "Tâche mise à jour avec succès",
      });
    },
    onError: (error: any) => {
      toast.error("Erreur", {
        description: error.message || "Impossible de mettre à jour la tâche",
      });
    },
  });
}

// Hook to delete a task
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tasksService.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      toast.success("Succès", {
        description: "Tâche supprimée avec succès",
      });
    },
    onError: (error: any) => {
      toast.error("Erreur", {
        description: error.message || "Impossible de supprimer la tâche",
      });
    },
  });
}