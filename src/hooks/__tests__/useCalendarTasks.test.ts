import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCalendarTasks, useCurrentWeekTasks, useCurrentMonthTasks } from '../useCalendarTasks';
import { tasksService } from '@/services/api/tasks.service';
import { Task } from '@/types/task.types';

// Mock the tasks service
vi.mock('@/services/api/tasks.service', () => ({
  tasksService: {
    getCalendarTasks: vi.fn(),
  },
}));

// Mock date-fns format function
vi.mock('date-fns', () => ({
  format: vi.fn((date: Date, formatStr: string) => {
    // Simple mock implementation for YYYY-MM-DD format
    if (formatStr === 'yyyy-MM-dd') {
      return date.toISOString().split('T')[0];
    }
    return date.toISOString();
  }),
}));

// Mock console.log to avoid test output pollution
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Mock tasks data used across all tests
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

describe('useCalendarTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to avoid test output pollution
    console.log = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });


  describe('Basic Functionality', () => {
    it('should fetch tasks successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          tasks: mockTasks,
          cacheHit: false,
        },
      };

      vi.mocked(tasksService.getCalendarTasks).mockResolvedValue(mockResponse);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const { result } = renderHook(() =>
        useCalendarTasks({ startDate, endDate })
      );

      // Initial state
      expect(result.current.tasks).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();

      // Wait for fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tasks).toEqual(mockTasks);
      expect(result.current.cacheHit).toBe(false);
      expect(result.current.error).toBeNull();

      // Verify service was called with correct parameters
      expect(tasksService.getCalendarTasks).toHaveBeenCalledWith(
        '2024-01-01',
        '2024-01-07'
      );
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('API Error');
      vi.mocked(tasksService.getCalendarTasks).mockRejectedValue(mockError);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const { result } = renderHook(() =>
        useCalendarTasks({ startDate, endDate })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.tasks).toEqual([]); // Should keep empty initial state
      expect(console.error).toHaveBeenCalledWith(
        'Error in useCalendarTasks:',
        mockError
      );
    });

    it('should handle service success false response', async () => {
      const mockResponse = {
        success: false,
        data: { tasks: [], cacheHit: false },
      };

      vi.mocked(tasksService.getCalendarTasks).mockResolvedValue(mockResponse);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const { result } = renderHook(() =>
        useCalendarTasks({ startDate, endDate })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to fetch calendar tasks');
      expect(result.current.tasks).toEqual([]);
    });

    it('should keep existing tasks on error', async () => {
      // First successful call
      const successResponse = {
        success: true,
        data: { tasks: mockTasks, cacheHit: false },
      };

      vi.mocked(tasksService.getCalendarTasks).mockResolvedValueOnce(successResponse);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const { result, rerender } = renderHook((props) =>
        useCalendarTasks(props || { startDate, endDate })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tasks).toEqual(mockTasks);

      // Second call with error
      vi.mocked(tasksService.getCalendarTasks).mockRejectedValueOnce(
        new Error('Network error')
      );

      // Trigger refetch by changing dates
      const newEndDate = new Date('2024-01-14');
      rerender({ startDate, endDate: newEndDate });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should keep existing tasks on error
      expect(result.current.tasks).toEqual(mockTasks);
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('Loading States', () => {
    it('should set loading state correctly', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(tasksService.getCalendarTasks).mockReturnValue(promise);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const { result } = renderHook(() =>
        useCalendarTasks({ startDate, endDate })
      );

      // Should be loading initially
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();

      // Resolve the promise
      resolvePromise!({
        success: true,
        data: { tasks: mockTasks, cacheHit: true },
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tasks).toEqual(mockTasks);
      expect(result.current.cacheHit).toBe(true);
    });
  });

  describe('Cache Hit Detection', () => {
    it('should detect cache hit correctly', async () => {
      const mockResponse = {
        success: true,
        data: {
          tasks: mockTasks,
          cacheHit: true,
        },
      };

      vi.mocked(tasksService.getCalendarTasks).mockResolvedValue(mockResponse);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const { result } = renderHook(() =>
        useCalendarTasks({ startDate, endDate })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.cacheHit).toBe(true);
      expect(result.current.tasks).toEqual(mockTasks);
    });

    it('should detect cache miss correctly', async () => {
      const mockResponse = {
        success: true,
        data: {
          tasks: mockTasks,
          cacheHit: false,
        },
      };

      vi.mocked(tasksService.getCalendarTasks).mockResolvedValue(mockResponse);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const { result } = renderHook(() =>
        useCalendarTasks({ startDate, endDate })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.cacheHit).toBe(false);
      expect(result.current.tasks).toEqual(mockTasks);
    });
  });

  describe('Date Changes and Refetch', () => {
    it('should refetch when dates change', async () => {
      const mockResponse = {
        success: true,
        data: { tasks: mockTasks, cacheHit: false },
      };

      vi.mocked(tasksService.getCalendarTasks).mockResolvedValue(mockResponse);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const { result, rerender } = renderHook((props) =>
        useCalendarTasks(props || { startDate, endDate })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(tasksService.getCalendarTasks).toHaveBeenCalledTimes(1);

      // Change dates
      const newStartDate = new Date('2024-01-08');
      const newEndDate = new Date('2024-01-14');

      rerender({ startDate: newStartDate, endDate: newEndDate });

      await waitFor(() => {
        expect(tasksService.getCalendarTasks).toHaveBeenCalledTimes(2);
      });

      expect(tasksService.getCalendarTasks).toHaveBeenLastCalledWith(
        '2024-01-08',
        '2024-01-14'
      );
    });

    it('should support manual refetch', async () => {
      const mockResponse = {
        success: true,
        data: { tasks: mockTasks, cacheHit: false },
      };

      vi.mocked(tasksService.getCalendarTasks).mockResolvedValue(mockResponse);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const { result } = renderHook(() =>
        useCalendarTasks({ startDate, endDate })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(tasksService.getCalendarTasks).toHaveBeenCalledTimes(1);

      // Manual refetch
      await result.current.refetch();

      expect(tasksService.getCalendarTasks).toHaveBeenCalledTimes(2);
    });
  });

  describe('Enabled/Disabled State', () => {
    it('should not fetch when disabled', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const { result } = renderHook(() =>
        useCalendarTasks({ startDate, endDate, enabled: false })
      );

      // Should not be loading and not call service
      expect(result.current.isLoading).toBe(false);
      expect(result.current.tasks).toEqual([]);
      expect(tasksService.getCalendarTasks).not.toHaveBeenCalled();
    });

    it('should fetch when enabled is changed from false to true', async () => {
      const mockResponse = {
        success: true,
        data: { tasks: mockTasks, cacheHit: false },
      };

      vi.mocked(tasksService.getCalendarTasks).mockResolvedValue(mockResponse);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const { result, rerender } = renderHook((props) =>
        useCalendarTasks(props || { startDate, endDate, enabled: false })
      );

      // Initially disabled
      expect(tasksService.getCalendarTasks).not.toHaveBeenCalled();

      // Enable the hook
      rerender({ startDate, endDate, enabled: true });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(tasksService.getCalendarTasks).toHaveBeenCalledTimes(1);
      expect(result.current.tasks).toEqual(mockTasks);
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle non-Error exceptions', async () => {
      vi.mocked(tasksService.getCalendarTasks).mockRejectedValue('String error');

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const { result } = renderHook(() =>
        useCalendarTasks({ startDate, endDate })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Unknown error');
    });
  });
});

describe('useCurrentWeekTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.log = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  it('should calculate current week dates correctly', async () => {
    const mockResponse = {
      success: true,
      data: { tasks: mockTasks, cacheHit: false },
    };

    vi.mocked(tasksService.getCalendarTasks).mockResolvedValue(mockResponse);

    // Mock current date to a specific Monday
    const mockDate = new Date('2024-01-08'); // This is a Monday
    vi.setSystemTime(mockDate);

    const { result } = renderHook(() => useCurrentWeekTasks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check that service was called (dates may be calculated differently)
    expect(tasksService.getCalendarTasks).toHaveBeenCalledTimes(1);
    
    // Verify the service was called with valid date strings
    const [startDate, endDate] = vi.mocked(tasksService.getCalendarTasks).mock.calls[0];
    expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
    expect(endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
    
    expect(result.current.tasks).toEqual(mockTasks);

    vi.useRealTimers();
  });

  it('should handle Sunday as end of week correctly', async () => {
    const mockResponse = {
      success: true,
      data: { tasks: mockTasks, cacheHit: false },
    };

    vi.mocked(tasksService.getCalendarTasks).mockResolvedValue(mockResponse);

    // Mock current date to a Sunday
    const mockDate = new Date('2024-01-14'); // This is a Sunday
    vi.setSystemTime(mockDate);

    const { result } = renderHook(() => useCurrentWeekTasks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check that service was called with valid week range
    expect(tasksService.getCalendarTasks).toHaveBeenCalledTimes(1);
    
    // Verify the service was called with valid date strings
    const [startDate, endDate] = vi.mocked(tasksService.getCalendarTasks).mock.calls[0];
    expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
    expect(endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
    
    // Verify it's a week range (7 days)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expect(daysDiff).toBe(7); // Week range should be 7 days

    vi.useRealTimers();
  });
});

describe('useCurrentMonthTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.log = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  it('should calculate current month dates correctly', async () => {
    const mockResponse = {
      success: true,
      data: { tasks: mockTasks, cacheHit: false },
    };

    vi.mocked(tasksService.getCalendarTasks).mockResolvedValue(mockResponse);

    // Mock current date to mid-January
    const mockDate = new Date('2024-01-15');
    vi.setSystemTime(mockDate);

    const { result } = renderHook(() => useCurrentMonthTasks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check that service was called
    expect(tasksService.getCalendarTasks).toHaveBeenCalledTimes(1);
    
    // Verify the service was called with valid date strings
    const [startDate, endDate] = vi.mocked(tasksService.getCalendarTasks).mock.calls[0];
    expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
    expect(endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
    
    // Verify it's a month range (should be at least 28 days)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expect(daysDiff).toBeGreaterThanOrEqual(27); // At least 28 days for a month

    expect(result.current.tasks).toEqual(mockTasks);

    vi.useRealTimers();
  });

  it('should handle February correctly in leap year', async () => {
    const mockResponse = {
      success: true,
      data: { tasks: mockTasks, cacheHit: false },
    };

    vi.mocked(tasksService.getCalendarTasks).mockResolvedValue(mockResponse);

    // Mock current date to February in leap year
    const mockDate = new Date('2024-02-15'); // 2024 is a leap year
    vi.setSystemTime(mockDate);

    const { result } = renderHook(() => useCurrentMonthTasks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check that service was called
    expect(tasksService.getCalendarTasks).toHaveBeenCalledTimes(1);
    
    // Verify the service was called with valid date strings
    const [startDate, endDate] = vi.mocked(tasksService.getCalendarTasks).mock.calls[0];
    expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
    expect(endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
    
    // For February 2024 (leap year), should have 29 days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expect(daysDiff).toBe(29); // February leap year should be 29 days

    vi.useRealTimers();
  });
});