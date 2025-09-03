import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService, Task } from '@/services/api/tasks.service';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  return useMutation({
    mutationFn: tasksService.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      toast({
        title: "Succès",
        description: "Tâche créée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la tâche",
        variant: "destructive",
      });
    },
  });
}

// Hook to update a task
export function useUpdateTask(id: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (task: Partial<Task>) => tasksService.updateTask(id, task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      queryClient.invalidateQueries({ queryKey: TASK_KEY(id) });
      toast({
        title: "Succès",
        description: "Tâche mise à jour avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la tâche",
        variant: "destructive",
      });
    },
  });
}

// Hook to delete a task
export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: tasksService.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      toast({
        title: "Succès",
        description: "Tâche supprimée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer la tâche",
        variant: "destructive",
      });
    },
  });
}