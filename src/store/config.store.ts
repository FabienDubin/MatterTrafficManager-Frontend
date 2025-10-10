import { create } from 'zustand';
import React from 'react';
import { configService } from '@/services/api/config.service';
import { clientsService } from '@/services/api/clients.service';
import type { Client } from '@/types/client.types';

interface AsyncModeConfig {
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface TeamConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
}

export interface TaskStatusColors {
  not_started: string;
  in_progress: string;
  completed: string;
}

// Couleurs par défaut pour les statuts de tâches
export const DEFAULT_TASK_STATUS_COLORS: TaskStatusColors = {
  not_started: '#6b7280', // Gris slate-500
  in_progress: '#f59e0b', // Orange amber-500
  completed: '#10b981',  // Vert emerald-500
} as const;

export type ColorMode = 'client' | 'taskStatus';

interface ConfigStore {
  // State
  asyncMode: AsyncModeConfig;
  clientColors: Record<string, string>;
  taskStatusColors: TaskStatusColors;
  clients: Client[];
  displayedTeams: TeamConfig[];
  isLoaded: boolean;
  isLoading: boolean;
  isColorsLoaded: boolean;
  isStatusColorsLoaded: boolean;
  isTeamsLoaded: boolean;
  lastFetched: string | null;

  // Actions
  loadAsyncConfig: () => Promise<void>;
  updateAsyncConfig: (config: AsyncModeConfig) => Promise<void>;
  loadTaskStatusColors: () => Promise<void>;
  updateTaskStatusColors: (colors: TaskStatusColors) => Promise<void>;
  loadClients: () => Promise<void>;
  loadDisplayedTeams: () => Promise<void>;
  updateDisplayedTeams: (teams: Array<{ id: string; icon: string; color: string; order: number }>) => Promise<void>;
  refreshConfig: () => Promise<void>;
  getAsyncMode: () => AsyncModeConfig;
  getTaskStatusColor: (status: string) => string;
  getColorForTask: (task: any, mode: ColorMode, getClientColor: (id: string) => string | undefined) => string;
  isConfigStale: () => boolean;
}

// TTL (Time To Live) for config cache: 10 minutes
const CONFIG_TTL = 10 * 60 * 1000;

export const useConfigStore = create<ConfigStore>((set, get) => ({
  // Initial state
  asyncMode: {
    create: false,
    update: false,
    delete: false,
  },
  clientColors: {},
  taskStatusColors: DEFAULT_TASK_STATUS_COLORS,
  clients: [],
  displayedTeams: [],
  isLoaded: false,
  isLoading: false,
  isColorsLoaded: false,
  isStatusColorsLoaded: false,
  isTeamsLoaded: false,
  lastFetched: null,

  // Load config from API
  loadAsyncConfig: async () => {
    const { isLoading } = get();
    if (isLoading) return;

    set({ isLoading: true });
    try {
      const config = await configService.getAsyncModeConfig();
      set({
        asyncMode: config,
        isLoaded: true,
        isLoading: false,
        lastFetched: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to load async config:', error);
      set({
        asyncMode: { create: false, update: false, delete: false },
        isLoaded: true,
        isLoading: false,
      });
    }
  },

  updateAsyncConfig: async (config: AsyncModeConfig) => {
    try {
      await configService.updateAsyncModeConfig(config);
      set({ asyncMode: config });
      window.dispatchEvent(new CustomEvent('async-config-changed', { detail: config }));
    } catch (error) {
      console.error('Failed to update async config:', error);
      throw error;
    }
  },

  // Load clients
  loadClients: async () => {
    try {
      const clientsData = await clientsService.getAllClients();
      set({ clients: clientsData.data });
    } catch (error) {
      console.error('Failed to load clients:', error);
      set({ clients: [] });
    }
  },

  // Load task status colors from API
  loadTaskStatusColors: async () => {
    try {
      const taskStatusColors = await configService.getTaskStatusColors();
      set({ taskStatusColors, isStatusColorsLoaded: true });
    } catch (error) {
      console.error('Failed to load task status colors:', error);
      set({ taskStatusColors: DEFAULT_TASK_STATUS_COLORS, isStatusColorsLoaded: true });
    }
  },

  // Update task status colors via API
  updateTaskStatusColors: async (colors: TaskStatusColors) => {
    try {
      await configService.updateTaskStatusColors(colors);
      set({ taskStatusColors: colors });
      window.dispatchEvent(new CustomEvent('task-status-colors-changed', { detail: colors }));
    } catch (error) {
      console.error('Failed to update task status colors:', error);
      throw error;
    }
  },

  // Load displayed teams
  loadDisplayedTeams: async () => {
    try {
      const response = await configService.getTeamsDisplayConfig();
      const teams = response.teams || [];
      set({ displayedTeams: teams, isTeamsLoaded: true });
    } catch (error) {
      console.error('Failed to load displayed teams:', error);
      set({ displayedTeams: [], isTeamsLoaded: true });
    }
  },

  updateDisplayedTeams: async (teams: Array<{ id: string; icon: string; color: string; order: number }>) => {
    try {
      await configService.updateTeamsDisplayConfig(teams);
      await get().loadDisplayedTeams();
      window.dispatchEvent(new CustomEvent('teams-display-changed', { detail: teams }));
    } catch (error) {
      console.error('Failed to update displayed teams:', error);
      throw error;
    }
  },

  // Force refresh from API
  refreshConfig: async () => {
    set({ isLoaded: false });
    await Promise.all([
      get().loadAsyncConfig(),
      get().loadTaskStatusColors(),
      get().loadClients(),
      get().loadDisplayedTeams(),
    ]);
  },

  // Get color for a task status
  getTaskStatusColor: (status: string) => {
    const { taskStatusColors } = get();
    const normalizedStatus = status.toLowerCase();
    
    if (normalizedStatus === 'completed' || normalizedStatus === 'terminé') {
      return taskStatusColors.completed;
    }
    if (normalizedStatus === 'in_progress' || normalizedStatus === 'en cours' || normalizedStatus === 'a valider') {
      return taskStatusColors.in_progress;
    }
    return taskStatusColors.not_started;
  },

  // Getter unifié pour récupérer la couleur d'une tâche selon le mode
  getColorForTask: (task: any, mode: ColorMode, getClientColor: (id: string) => string | undefined) => {
    const store = get();
    
    switch (mode) {
      case 'client':
        if (task.clientId) {
          return getClientColor(task.clientId) || '#6b7280';
        }
        return '#6b7280';
        
      case 'taskStatus':
        return store.getTaskStatusColor(task.status);
        
      default:
        return '#6b7280';
    }
  },

  // Check if config is stale
  isConfigStale: () => {
    const { lastFetched } = get();
    if (!lastFetched) return true;
    const age = Date.now() - new Date(lastFetched).getTime();
    return age > CONFIG_TTL;
  },

  // Get current async mode
  getAsyncMode: () => {
    const { asyncMode, isLoaded, isConfigStale } = get();

    if (!isLoaded) {
      get().loadAsyncConfig();
      return { create: false, update: false, delete: false };
    }

    if (isConfigStale()) {
      get().loadAsyncConfig();
    }

    return asyncMode;
  },
}));

// Hook to auto-load config on app startup
export const useInitConfigStore = () => {
  const {
    loadAsyncConfig,
    loadTaskStatusColors,
    loadClients,
    loadDisplayedTeams,
    isLoaded,
    isStatusColorsLoaded,
    isTeamsLoaded,
  } = useConfigStore();

  React.useEffect(() => {
    const promises = [];

    if (!isLoaded) {
      promises.push(loadAsyncConfig());
    }
    if (!isStatusColorsLoaded) {
      promises.push(loadTaskStatusColors());
    }
    if (!isTeamsLoaded) {
      promises.push(loadDisplayedTeams());
    }
    promises.push(loadClients());

    if (promises.length > 0) {
      Promise.all(promises).catch(error => {
        console.error('Failed to initialize config store:', error);
      });
    }
  }, [loadAsyncConfig, loadTaskStatusColors, loadClients, loadDisplayedTeams, isLoaded, isStatusColorsLoaded, isTeamsLoaded]);

  // Listen for config changes from other tabs/windows
  React.useEffect(() => {
    const handleConfigChange = (event: CustomEvent) => {
      useConfigStore.setState({
        asyncMode: event.detail,
        lastFetched: new Date().toISOString(),
      });
    };

    const handleColorChange = (event: CustomEvent) => {
      useConfigStore.setState({
        clientColors: event.detail,
      });
    };

    const handleStatusColorChange = (event: CustomEvent) => {
      useConfigStore.setState({
        taskStatusColors: event.detail,
      });
    };

    const handleTeamsChange = () => {
      useConfigStore.getState().loadDisplayedTeams();
    };

    window.addEventListener('async-config-changed', handleConfigChange as EventListener);
    window.addEventListener('client-colors-changed', handleColorChange as EventListener);
    window.addEventListener('task-status-colors-changed', handleStatusColorChange as EventListener);
    window.addEventListener('teams-display-changed', handleTeamsChange as EventListener);

    return () => {
      window.removeEventListener('async-config-changed', handleConfigChange as EventListener);
      window.removeEventListener('client-colors-changed', handleColorChange as EventListener);
      window.removeEventListener('task-status-colors-changed', handleStatusColorChange as EventListener);
      window.removeEventListener('teams-display-changed', handleTeamsChange as EventListener);
    };
  }, []);
};

// Hook for async config
export const useAsyncConfig = () => {
  const { isLoaded, getAsyncMode } = useConfigStore();

  React.useEffect(() => {
    if (!isLoaded) {
      useConfigStore.getState().loadAsyncConfig();
    }
  }, [isLoaded]);

  return {
    asyncMode: getAsyncMode(),
    isLoaded,
  };
};

// Hook to ensure client colors are loaded (uses clientsService)
export const useClientColors = () => {
  const { clientColors, isColorsLoaded } = useConfigStore();

  React.useEffect(() => {
    if (!isColorsLoaded) {
      clientsService.getClientColors()
        .then(response => {
          useConfigStore.setState({ 
            clientColors: response.data || {}, 
            isColorsLoaded: true 
          });
        })
        .catch(error => {
          console.error('Failed to load client colors:', error);
          useConfigStore.setState({ 
            clientColors: {}, 
            isColorsLoaded: true 
          });
        });
    }
  }, [isColorsLoaded]);

  const getClientColor = (clientId: string) => clientColors[clientId];

  return {
    clientColors,
    isColorsLoaded,
    getClientColor,
  };
};

// Hook to ensure displayed teams are loaded
export const useDisplayedTeams = () => {
  const { displayedTeams, isTeamsLoaded, loadDisplayedTeams } = useConfigStore();

  React.useEffect(() => {
    if (!isTeamsLoaded) {
      loadDisplayedTeams();
    }
  }, [isTeamsLoaded, loadDisplayedTeams]);

  return {
    displayedTeams,
    isTeamsLoaded,
  };
};

// Hook to ensure task status colors are loaded
export const useTaskStatusColors = () => {
  const { taskStatusColors, isStatusColorsLoaded, getTaskStatusColor, loadTaskStatusColors } = useConfigStore();

  React.useEffect(() => {
    if (!isStatusColorsLoaded) {
      loadTaskStatusColors();
    }
  }, [isStatusColorsLoaded, loadTaskStatusColors]);

  return {
    taskStatusColors,
    isStatusColorsLoaded,
    getTaskStatusColor,
  };
};

// Hook unifié pour les couleurs de tâches
export const useTaskColors = () => {
  const { getColorForTask } = useConfigStore();
  const { isColorsLoaded: clientLoaded, getClientColor } = useClientColors();
  const { isStatusColorsLoaded: statusLoaded } = useTaskStatusColors();

  const allColorsLoaded = clientLoaded && statusLoaded;
  const getTaskColor = (task: any, mode: ColorMode) => getColorForTask(task, mode, getClientColor);

  return {
    getColorForTask: getTaskColor,
    allColorsLoaded,
  };
};