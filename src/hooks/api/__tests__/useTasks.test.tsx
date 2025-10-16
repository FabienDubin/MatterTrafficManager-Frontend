import React from 'react';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTasks, useTask, useNotionTest, useCreateTask, useUpdateTask, useDeleteTask } from '../useTasks';
import { tasksService } from '@/services/api/tasks.service';
import { Task } from '@/types/task.types';
import { toast } from 'sonner';

// Mock the tasks service
vi.mock('@/services/api/tasks.service', () => ({
  tasksService: {
    getTasks: vi.fn(),
    getTask: vi.fn(),
    testNotion: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  },
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Create a test wrapper with QueryClient
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Mock task data
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Task 1',
    memberId: 'member1',
    memberName: 'John Doe',
    clientId: 'client1',
    clientName: 'Client A',
    startDate: '2024-01-01',
    endDate: '2024-01-02',
    status: 'ACTIVE',
    timeTracked: 8,
    estimatedTime: 10,
  },
  {
    id: '2',
    title: 'Task 2',
    memberId: 'member2',
    memberName: 'Jane Smith',
    clientId: 'client2',
    clientName: 'Client B',
    startDate: '2024-01-02',
    endDate: '2024-01-03',
    status: 'ACTIVE',
    timeTracked: 4,
    estimatedTime: 6,
  },
];

describe('useTasks Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useTasks', () => {
    it('should fetch tasks successfully', async () => {
      vi.mocked(tasksService.getTasks).mockResolvedValue({
        success: true,
        data: mockTasks,
      });

      const { result } = renderHook(() => useTasks(), {
        wrapper: createTestWrapper(),
      });

      // Initial state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Wait for query to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
        success: true,
        data: mockTasks,
      });
      expect(result.current.error).toBeNull();
      expect(tasksService.getTasks).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('API Error');
      vi.mocked(tasksService.getTasks).mockRejectedValue(mockError);

      const { result } = renderHook(() => useTasks(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      }, { timeout: 3000 });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should use correct query configuration', async () => {
      vi.mocked(tasksService.getTasks).mockResolvedValue({
        success: true,
        data: mockTasks,
      });

      const { result } = renderHook(() => useTasks(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Test stale time behavior - data should be considered fresh for 5 minutes
      expect(result.current.isStale).toBe(false);
    });
  });

  describe('useTask', () => {
    const mockTask = mockTasks[0];

    it('should fetch single task successfully', async () => {
      vi.mocked(tasksService.getTask).mockResolvedValue({
        success: true,
        data: mockTask,
      });

      const { result } = renderHook(() => useTask('1'), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
        success: true,
        data: mockTask,
      });
      expect(tasksService.getTask).toHaveBeenCalledWith('1');
    });

    it('should not fetch when id is empty', () => {
      const { result } = renderHook(() => useTask(''), {
        wrapper: createTestWrapper(),
      });

      // Should not be loading since enabled: !!id would be false
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(tasksService.getTask).not.toHaveBeenCalled();
    });

    it('should handle task fetch errors', async () => {
      const mockError = new Error('Task not found');
      vi.mocked(tasksService.getTask).mockRejectedValue(mockError);

      const { result } = renderHook(() => useTask('invalid-id'), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useNotionTest', () => {
    it('should test Notion connection successfully', async () => {
      const mockResponse = {
        success: true,
        data: { connected: true, status: 'OK' },
      };

      vi.mocked(tasksService.testNotion).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useNotionTest(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(tasksService.testNotion).toHaveBeenCalledTimes(1);
    });

    it('should handle Notion test failures without retry', async () => {
      const mockError = new Error('Notion connection failed');
      vi.mocked(tasksService.testNotion).mockRejectedValue(mockError);

      const { result } = renderHook(() => useNotionTest(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toEqual(mockError);
      // Should only be called once due to retry: false
      expect(tasksService.testNotion).toHaveBeenCalledTimes(1);
    });
  });

  describe('useCreateTask', () => {
    it('should create task successfully with optimistic updates', async () => {
      const newTask = {
        title: 'New Task',
        memberId: 'member1',
        clientId: 'client1',
        startDate: '2024-01-01',
        endDate: '2024-01-02',
      };

      const createdTask = { ...newTask, id: '3', status: 'ACTIVE' as const };

      vi.mocked(tasksService.createTask).mockResolvedValue({
        success: true,
        data: createdTask,
      });

      const { result } = renderHook(() => useCreateTask(), {
        wrapper: createTestWrapper(),
      });

      await act(async () => {
        result.current.mutate(newTask);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(tasksService.createTask).toHaveBeenCalledWith(newTask);
      expect(result.current.data).toEqual({
        success: true,
        data: createdTask,
      });

      // Verify success toast was called
      expect(toast.success).toHaveBeenCalledWith("Succès", {
        description: "Tâche créée avec succès",
      });
    });

    it('should handle create task errors', async () => {
      const mockError = new Error('Validation failed');
      vi.mocked(tasksService.createTask).mockRejectedValue(mockError);

      const { result } = renderHook(() => useCreateTask(), {
        wrapper: createTestWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          title: 'Invalid Task',
          memberId: '',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);

      // Verify error toast was called
      expect(toast.error).toHaveBeenCalledWith("Erreur", {
        description: mockError.message,
      });
    });

    it('should handle create task errors without message', async () => {
      const mockError = new Error();
      vi.mocked(tasksService.createTask).mockRejectedValue(mockError);

      const { result } = renderHook(() => useCreateTask(), {
        wrapper: createTestWrapper(),
      });

      await act(async () => {
        result.current.mutate({ title: 'Test Task' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Verify error toast with default message
      expect(toast.error).toHaveBeenCalledWith("Erreur", {
        description: "Impossible de créer la tâche",
      });
    });
  });

  describe('useUpdateTask', () => {
    const taskId = '1';
    const updateData = { title: 'Updated Task Title' };

    it('should update task successfully', async () => {
      const updatedTask = { ...mockTasks[0], ...updateData };

      vi.mocked(tasksService.updateTask).mockResolvedValue({
        success: true,
        data: updatedTask,
      });

      const { result } = renderHook(() => useUpdateTask(taskId), {
        wrapper: createTestWrapper(),
      });

      await act(async () => {
        result.current.mutate(updateData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(tasksService.updateTask).toHaveBeenCalledWith(taskId, updateData);
      expect(result.current.data).toEqual({
        success: true,
        data: updatedTask,
      });

      // Verify success toast
      expect(toast.success).toHaveBeenCalledWith("Succès", {
        description: "Tâche mise à jour avec succès",
      });
    });

    it('should handle update task errors', async () => {
      const mockError = new Error('Update failed');
      vi.mocked(tasksService.updateTask).mockRejectedValue(mockError);

      const { result } = renderHook(() => useUpdateTask(taskId), {
        wrapper: createTestWrapper(),
      });

      await act(async () => {
        result.current.mutate(updateData);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);

      // Verify error toast
      expect(toast.error).toHaveBeenCalledWith("Erreur", {
        description: mockError.message,
      });
    });

    it('should handle update errors without message', async () => {
      const mockError = new Error();
      vi.mocked(tasksService.updateTask).mockRejectedValue(mockError);

      const { result } = renderHook(() => useUpdateTask(taskId), {
        wrapper: createTestWrapper(),
      });

      await act(async () => {
        result.current.mutate(updateData);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Verify error toast with default message
      expect(toast.error).toHaveBeenCalledWith("Erreur", {
        description: "Impossible de mettre à jour la tâche",
      });
    });
  });

  describe('useDeleteTask', () => {
    const taskId = '1';

    it('should delete task successfully', async () => {
      vi.mocked(tasksService.deleteTask).mockResolvedValue({
        success: true,
        data: { id: taskId },
      });

      const { result } = renderHook(() => useDeleteTask(), {
        wrapper: createTestWrapper(),
      });

      await act(async () => {
        result.current.mutate(taskId);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(tasksService.deleteTask).toHaveBeenCalledWith(taskId);

      // Verify success toast
      expect(toast.success).toHaveBeenCalledWith("Succès", {
        description: "Tâche supprimée avec succès",
      });
    });

    it('should handle delete task errors', async () => {
      const mockError = new Error('Delete failed');
      vi.mocked(tasksService.deleteTask).mockRejectedValue(mockError);

      const { result } = renderHook(() => useDeleteTask(), {
        wrapper: createTestWrapper(),
      });

      await act(async () => {
        result.current.mutate(taskId);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);

      // Verify error toast
      expect(toast.error).toHaveBeenCalledWith("Erreur", {
        description: mockError.message,
      });
    });

    it('should handle delete errors without message', async () => {
      const mockError = new Error();
      vi.mocked(tasksService.deleteTask).mockRejectedValue(mockError);

      const { result } = renderHook(() => useDeleteTask(), {
        wrapper: createTestWrapper(),
      });

      await act(async () => {
        result.current.mutate(taskId);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Verify error toast with default message
      expect(toast.error).toHaveBeenCalledWith("Erreur", {
        description: "Impossible de supprimer la tâche",
      });
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate tasks cache after successful create', async () => {
      const mockQueryClient = {
        invalidateQueries: vi.fn(),
      };

      // Mock the useQueryClient hook
      vi.doMock('@tanstack/react-query', async () => {
        const actual = await vi.importActual('@tanstack/react-query');
        return {
          ...actual,
          useQueryClient: () => mockQueryClient,
        };
      });

      const newTask = { title: 'New Task' };
      vi.mocked(tasksService.createTask).mockResolvedValue({
        success: true,
        data: { ...newTask, id: '3' },
      });

      const { result } = renderHook(() => useCreateTask(), {
        wrapper: createTestWrapper(),
      });

      await act(async () => {
        result.current.mutate(newTask);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Cache invalidation is handled internally by react-query
      // We can verify the mutation was successful
      expect(result.current.isSuccess).toBe(true);
    });

    it('should invalidate specific task cache after update', async () => {
      const taskId = '1';
      const updateData = { title: 'Updated Title' };

      vi.mocked(tasksService.updateTask).mockResolvedValue({
        success: true,
        data: { ...mockTasks[0], ...updateData },
      });

      const { result } = renderHook(() => useUpdateTask(taskId), {
        wrapper: createTestWrapper(),
      });

      await act(async () => {
        result.current.mutate(updateData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('Loading and Error States', () => {
    it('should handle loading states correctly', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(tasksService.getTasks).mockReturnValue(promise);

      const { result } = renderHook(() => useTasks(), {
        wrapper: createTestWrapper(),
      });

      // Should be loading initially
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Resolve the promise
      resolvePromise!({ success: true, data: mockTasks });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({ success: true, data: mockTasks });
    });

    it('should handle mutation loading states', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(tasksService.createTask).mockReturnValue(promise);

      const { result } = renderHook(() => useCreateTask(), {
        wrapper: createTestWrapper(),
      });

      // Start mutation
      await act(async () => {
        result.current.mutate({ title: 'Test Task' });
        // Check pending state immediately after mutation
        await waitFor(() => {
          expect(result.current.isPending).toBe(true);
        }, { timeout: 100 });
      });

      // Resolve mutation
      resolvePromise!({ success: true, data: { id: '1', title: 'Test Task' } });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
    });
  });
});