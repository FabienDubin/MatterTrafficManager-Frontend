import { apiClient } from './client';

export interface Task {
  id: string;
  title: string;
  workPeriod?: {
    startDate: string; // ISO 8601 format avec heure
    endDate: string;   // ISO 8601 format avec heure
  };
  assignedMembers?: string[];
  projectId?: string;
  clientId?: string;
  taskType?: 'task' | 'holiday' | 'remote';
  status: 'not_started' | 'in_progress' | 'completed';
  description?: string;
  notes?: string;
  billedHours?: number;
  actualHours?: number;
  createdAt?: string;
  updatedAt?: string;
  syncedAt?: string;
}

export interface NotionTestResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface CalendarTasksResponse {
  success: boolean;
  data: {
    tasks: Task[];
    cacheHit: boolean;
    period: {
      start: string;
      end: string;
    };
  };
  meta: {
    count: number;
    cached: boolean;
    timestamp: string;
  };
}

export const tasksService = {
  // Get tasks for calendar view
  async getCalendarTasks(startDate: string, endDate: string): Promise<CalendarTasksResponse> {
    try {
      const { data } = await apiClient.get<CalendarTasksResponse>('/tasks/calendar', {
        params: {
          startDate,
          endDate
        }
      });
      return data;
    } catch (error) {
      console.error('Error fetching calendar tasks:', error);
      // Return mock data as fallback
      return {
        success: true,
        data: {
          tasks: getMockTasks(),
          cacheHit: false,
          period: {
            start: startDate,
            end: endDate
          }
        },
        meta: {
          count: 4,
          cached: false,
          timestamp: new Date().toISOString()
        }
      };
    }
  },

  // Get all tasks (when the endpoint is ready)
  async getTasks(): Promise<Task[]> {
    // For now, directly return mock data since the endpoint is not ready
    // This avoids the 401 error loop
    return getMockTasks();
    
    /* Will be enabled when backend endpoint is ready:
    try {
      const { data } = await apiClient.get<Task[]>('/notion/traffic/tasks');
      return data;
    } catch (error) {
      console.error('API error, using mock data:', error);
      return getMockTasks();
    }
    */
  },

  // Test Notion connection
  async testNotion(): Promise<NotionTestResponse> {
    const { data } = await apiClient.get<NotionTestResponse>('/notion/test');
    return data;
  },

  // Get a single task by ID (future implementation)
  async getTask(id: string): Promise<Task> {
    const { data } = await apiClient.get<Task>(`/notion/traffic/tasks/${id}`);
    return data;
  },

  // Create a new task (future implementation)
  async createTask(task: Partial<Task>): Promise<Task> {
    const { data } = await apiClient.post<Task>('/notion/traffic/tasks', task);
    return data;
  },

  // Update a task (future implementation)
  async updateTask(id: string, task: Partial<Task>): Promise<Task> {
    const { data } = await apiClient.put<Task>(`/notion/traffic/tasks/${id}`, task);
    return data;
  },

  // Delete a task (future implementation)
  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/notion/traffic/tasks/${id}`);
  }
};

// Mock data for demonstration
function getMockTasks(): Task[] {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return [
    {
      id: '1',
      title: 'Intégration API Notion',
      workPeriod: {
        startDate: now.toISOString(),
        endDate: new Date(now.getTime() + 2 * 3600000).toISOString(), // +2 hours
      },
      assignedMembers: ['Dev Team'],
      status: 'in_progress',
      description: 'Connecter l\'application avec l\'API Notion'
    },
    {
      id: '2',
      title: 'Review Code Frontend',
      workPeriod: {
        startDate: tomorrow.toISOString(),
        endDate: new Date(tomorrow.getTime() + 1.5 * 3600000).toISOString(), // +1.5 hours
      },
      assignedMembers: ['John Doe'],
      status: 'not_started',
      description: 'Révision du code React et TypeScript'
    },
    {
      id: '3',
      title: 'Déploiement Production',
      workPeriod: {
        startDate: nextWeek.toISOString(),
        endDate: new Date(nextWeek.getTime() + 3 * 3600000).toISOString(), // +3 hours
      },
      assignedMembers: ['DevOps Team'],
      status: 'not_started',
      description: 'Déployer sur Azure'
    },
    {
      id: '4',
      title: 'Tests E2E Playwright',
      workPeriod: {
        startDate: new Date(now.getTime() - 24 * 3600000).toISOString(), // yesterday
        endDate: new Date(now.getTime() - 22 * 3600000).toISOString(),
      },
      assignedMembers: ['QA Team'],
      status: 'completed',
      description: 'Tests automatisés complets'
    }
  ];
}