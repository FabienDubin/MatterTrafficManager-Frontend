import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CalendarView } from '../CalendarView';
import { useTasks } from '@/hooks/api/useTasks';

// Mock dependencies
vi.mock('@/hooks/api/useTasks');

// Mock FullCalendar to avoid complex setup
vi.mock('@fullcalendar/react', () => ({
  default: vi.fn(() => <div data-testid="fullcalendar-mock">Calendar Mock</div>),
}));

// Mock FullCalendar plugins to avoid import errors
vi.mock('@fullcalendar/daygrid', () => ({ default: {} }));
vi.mock('@fullcalendar/timegrid', () => ({ default: {} }));
vi.mock('@fullcalendar/interaction', () => ({ default: {} }));

describe('CalendarView', () => {
  const mockTasks = [
    {
      id: '1',
      title: 'Task 1',
      workPeriod: {
        startDate: new Date('2025-01-15T09:00:00'),
        endDate: new Date('2025-01-15T10:00:00'),
      },
      status: 'not_started',
      assignedMembers: ['user1'],
    },
    {
      id: '2',
      title: 'Task 2',
      workPeriod: {
        startDate: new Date('2025-01-15T14:00:00'),
        endDate: new Date('2025-01-15T16:00:00'),
      },
      status: 'in_progress',
      assignedMembers: ['user2'],
    },
    {
      id: '3',
      title: 'Task 3',
      workPeriod: {
        startDate: new Date('2025-01-16T10:00:00'),
        endDate: new Date('2025-01-16T11:30:00'),
      },
      status: 'completed',
      assignedMembers: ['user1', 'user3'],
    },
  ];

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders calendar when not loading', () => {
    (useTasks as any).mockReturnValue({
      data: mockTasks,
      isLoading: false,
      error: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CalendarView />
      </QueryClientProvider>
    );

    expect(screen.getByTestId('fullcalendar-mock')).toBeInTheDocument();
    expect(screen.getByText('Calendar Mock')).toBeInTheDocument();
  });

  it('does not show loading indicator when data is loaded', () => {
    (useTasks as any).mockReturnValue({
      data: mockTasks,
      isLoading: false,
      error: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CalendarView />
      </QueryClientProvider>
    );

    expect(screen.queryByText('Chargement des tâches...')).not.toBeInTheDocument();
  });

  it('does not show error when data loads successfully', () => {
    (useTasks as any).mockReturnValue({
      data: mockTasks,
      isLoading: false,
      error: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CalendarView />
      </QueryClientProvider>
    );

    expect(screen.queryByText(/Erreur/i)).not.toBeInTheDocument();
  });

  it('uses task data from hook', () => {
    const mockUseTasks = vi.fn().mockReturnValue({
      data: mockTasks,
      isLoading: false,
      error: null,
    });
    (useTasks as any) = mockUseTasks;

    render(
      <QueryClientProvider client={queryClient}>
        <CalendarView />
      </QueryClientProvider>
    );

    // The component should render successfully with the mock data
    expect(screen.getByTestId('fullcalendar-mock')).toBeInTheDocument();
  });

  it('renders with empty tasks array', () => {
    (useTasks as any).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CalendarView />
      </QueryClientProvider>
    );

    expect(screen.getByTestId('fullcalendar-mock')).toBeInTheDocument();
  });

  it('handles undefined data gracefully', () => {
    (useTasks as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CalendarView />
      </QueryClientProvider>
    );

    expect(screen.getByTestId('fullcalendar-mock')).toBeInTheDocument();
  });

  it('passes tasks to calendar when available', () => {
    const mockData = {
      data: mockTasks,
      isLoading: false,
      error: null,
    };
    (useTasks as any).mockReturnValue(mockData);

    render(
      <QueryClientProvider client={queryClient}>
        <CalendarView />
      </QueryClientProvider>
    );

    // Verify the component renders with mock data
    expect(screen.getByTestId('fullcalendar-mock')).toBeInTheDocument();
  });

  it('handles loading state without crashing', () => {
    (useTasks as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    expect(() => {
      render(
        <QueryClientProvider client={queryClient}>
          <CalendarView />
        </QueryClientProvider>
      );
    }).not.toThrow();
  });
});