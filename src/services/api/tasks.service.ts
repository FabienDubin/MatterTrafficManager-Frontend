import { apiClient } from './client';
import { useConfigStore } from '@/store/config.store';

export interface Task {
  id: string;
  title: string;
  workPeriod?: {
    startDate: string; // ISO 8601 format avec heure
    endDate: string;   // ISO 8601 format avec heure
  };
  assignedMembers?: string[];
  assignedMembersData?: Array<{
    id: string;
    name: string;
    email: string;
    teams?: string[];
  }>;
  projectId?: string;
  projectData?: {
    id: string;
    name: string;
    status: string;
  };
  clientId?: string;
  clientData?: {
    id: string;
    name: string;
  };
  teams?: string[];
  teamsData?: Array<{
    id: string;
    name: string;
  }>;
  involvedTeamIds?: string[];
  involvedTeamsData?: Array<{
    id: string;
    name: string;
  }>;
  taskType?: 'task' | 'holiday' | 'remote';
  status: 'not_started' | 'in_progress' | 'completed' | 'Pas Commencé' | 'A valider' | 'Terminé' | string;
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

  // Create a new task
  async createTask(task: Partial<Task>): Promise<Task> {
    // Get async mode from store (no API call needed!)
    const asyncMode = useConfigStore.getState().getAsyncMode();
    
    const response = await apiClient.post('/tasks', task, {
      params: {
        async: asyncMode.create
      }
    });
    
    // LOG DES CONFLITS POUR DEBUG
    if (response.data?.conflicts && response.data.conflicts.length > 0) {
      console.log('🚨 CONFLITS DÉTECTÉS (création):', response.data.conflicts);
      console.log('Response complète:', response.data);
    } else {
      console.log('✅ Pas de conflits détectés (création)');
      console.log('Response:', response.data);
    }
    
    // Backend returns { success: true, data: {...task} }
    // Extract the actual task from the wrapped response
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    
    // Fallback if response structure is different
    return response.data;
  },

  // Update a task
  async updateTask(id: string, task: Partial<Task>): Promise<Task> {
    // Get async mode from store (no API call needed!)
    const asyncMode = useConfigStore.getState().getAsyncMode();
    
    // Mode normal - Utilise la configuration async du store
    const response = await apiClient.put(`/tasks/${id}`, task, {
      params: {
        async: asyncMode.update
      }
    });
    
    // LOG DES CONFLITS POUR DEBUG (optionnel - enlever en production)
    if (response.data?.conflicts && response.data.conflicts.length > 0) {
      console.log('🚨 CONFLITS DÉTECTÉS:', response.data.conflicts);
      console.log('Response complète:', response.data);
    }
    
    // Backend returns { success: true, data: {...task} }
    // Extract the actual task from the wrapped response
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    
    // Fallback if response structure is different
    return response.data;
  },

  // Delete a task
  async deleteTask(id: string): Promise<void> {
    // Get async mode from store (no API call needed!)
    const asyncMode = useConfigStore.getState().getAsyncMode();
    
    await apiClient.delete(`/tasks/${id}`, {
      params: {
        async: asyncMode.delete
      }
    });
  },

  // Get today's task statistics
  async getTodayStats(): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    byType: {
      task: number;
      holiday: number;
      school: number;
      remote: number;
    };
  }> {
    const response = await apiClient.get('/tasks/stats/today');
    return response.data.data;
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