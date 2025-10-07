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

interface ConfigStore {
  // State
  asyncMode: AsyncModeConfig;
  clientColors: Record<string, string>; // { clientId: hexColor }
  clients: Client[];
  displayedTeams: TeamConfig[]; // NEW: Teams displayed in FilterPanel
  isLoaded: boolean;
  isLoading: boolean;
  isColorsLoaded: boolean; // Track if colors are loaded
  isTeamsLoaded: boolean; // Track if teams are loaded
  lastFetched: string | null;

  // Actions
  loadAsyncConfig: () => Promise<void>;
  updateAsyncConfig: (config: AsyncModeConfig) => Promise<void>;
  loadClientColors: () => Promise<void>;
  updateClientColors: (colors: Record<string, string>) => Promise<void>;
  loadClients: () => Promise<void>;
  loadDisplayedTeams: () => Promise<void>; // NEW
  updateDisplayedTeams: (
    teams: Array<{ id: string; icon: string; color: string; order: number }>
  ) => Promise<void>; // NEW
  refreshConfig: () => Promise<void>;
  getAsyncMode: () => AsyncModeConfig;
  getClientColor: (clientId: string) => string | undefined;
  isConfigStale: () => boolean;
}

// TTL (Time To Live) for config cache: 10 minutes
const CONFIG_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds

export const useConfigStore = create<ConfigStore>((set, get) => ({
  // Initial state
  asyncMode: {
    create: false,
    update: false,
    delete: false,
  },
  clientColors: {},
  clients: [],
  displayedTeams: [],
  isLoaded: false,
  isLoading: false,
  isColorsLoaded: false,
  isTeamsLoaded: false,
  lastFetched: null,

  // Load config from API (called once at app startup)
  loadAsyncConfig: async () => {
    const { isLoading } = get();

    // Prevent multiple concurrent loads
    if (isLoading) {
      return;
    }

    set({ isLoading: true });

    try {
      const config = await configService.getAsyncModeConfig();
      set({
        asyncMode: config,
        isLoaded: true,
        lastFetched: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to load async config:', error);
      // Keep default values on error
      set({ isLoaded: true });
    } finally {
      set({ isLoading: false });
    }
  },

  // Update config (called from admin panel)
  updateAsyncConfig: async (newConfig: AsyncModeConfig) => {
    try {
      await configService.updateAsyncModeConfig(newConfig);
      set({
        asyncMode: newConfig,
        lastFetched: new Date().toISOString(),
      });

      // Broadcast change to other components/windows
      window.dispatchEvent(
        new CustomEvent('async-config-changed', {
          detail: newConfig,
        })
      );
    } catch (error) {
      console.error('Failed to update async config:', error);
      throw error;
    }
  },

  // Load client colors from API
  loadClientColors: async () => {
    try {
      const response = await clientsService.getClientColors();
      set({
        clientColors: response.data,
        isColorsLoaded: true,
      });
    } catch (error) {
      console.error('Failed to load client colors:', error);
      set({
        clientColors: {},
        isColorsLoaded: true, // Even on error, mark as loaded
      });
    }
  },

  // Update client colors (called from admin panel)
  updateClientColors: async (colors: Record<string, string>) => {
    try {
      await clientsService.updateClientColors(colors);
      set({ clientColors: colors });

      // Broadcast change to other components/windows
      window.dispatchEvent(
        new CustomEvent('client-colors-changed', {
          detail: colors,
        })
      );
    } catch (error) {
      console.error('Failed to update client colors:', error);
      throw error;
    }
  },

  // Load all clients from API
  loadClients: async () => {
    try {
      const response = await clientsService.getAllClients();
      set({ clients: response.data });
    } catch (error) {
      console.error('Failed to load clients:', error);
      set({ clients: [] });
    }
  },

  // Load displayed teams configuration from API
  loadDisplayedTeams: async () => {
    try {
      const response = await configService.getTeamsDisplayConfig();

      set({
        displayedTeams: response.teams,
        isTeamsLoaded: true,
      });
    } catch (error) {
      set({
        displayedTeams: [],
        isTeamsLoaded: true, // Even on error, mark as loaded
      });
    }
  },

  // Update displayed teams configuration (called from admin panel)
  updateDisplayedTeams: async (
    teams: Array<{ id: string; icon: string; color: string; order: number }>
  ) => {
    try {
      await configService.updateTeamsDisplayConfig(teams);
      // Reload the teams after update to get the enriched data
      await get().loadDisplayedTeams();

      // Broadcast change to other components/windows
      window.dispatchEvent(
        new CustomEvent('teams-display-changed', {
          detail: teams,
        })
      );
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
      get().loadClientColors(),
      get().loadClients(),
      get().loadDisplayedTeams(),
    ]);
  },

  // Get color for a specific client
  getClientColor: (clientId: string) => {
    const { clientColors } = get();
    return clientColors[clientId];
  },

  // Check if config is stale (older than TTL)
  isConfigStale: () => {
    const { lastFetched } = get();
    if (!lastFetched) {
      return true;
    }

    const age = Date.now() - new Date(lastFetched).getTime();
    return age > CONFIG_TTL;
  },

  // Get current async mode (synchronous access with auto-refresh if stale)
  getAsyncMode: () => {
    const { asyncMode, isLoaded, isConfigStale } = get();

    if (!isLoaded) {
      // If not loaded yet, trigger load and return default
      get().loadAsyncConfig();
      return {
        create: false,
        update: false,
        delete: false,
      };
    }

    // Check if config is stale and refresh in background if needed
    if (isConfigStale()) {
      get().loadAsyncConfig(); // Non-blocking background refresh
    }

    return asyncMode;
  },
}));

// Hook to auto-load config on app startup
export const useInitConfigStore = () => {
  const {
    loadAsyncConfig,
    loadClientColors,
    loadClients,
    loadDisplayedTeams,
    isLoaded,
    isColorsLoaded,
    isTeamsLoaded,
  } = useConfigStore();

  // Load config once when hook is first used
  React.useEffect(() => {
    const promises = [];

    if (!isLoaded) {
      promises.push(loadAsyncConfig());
    }
    if (!isColorsLoaded) {
      promises.push(loadClientColors());
    }
    if (!isTeamsLoaded) {
      promises.push(loadDisplayedTeams());
    }
    // Always load clients (no flag for this resource)
    promises.push(loadClients());

    if (promises.length > 0) {
      Promise.all(promises).catch(error => {
        console.error('Failed to initialize config store:', error);
      });
    }
  }, [
    loadAsyncConfig,
    loadClientColors,
    loadClients,
    loadDisplayedTeams,
    isLoaded,
    isColorsLoaded,
    isTeamsLoaded,
  ]);

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

    const handleTeamsChange = () => {
      // Reload teams from API when config changes
      useConfigStore.getState().loadDisplayedTeams();
    };

    window.addEventListener('async-config-changed', handleConfigChange as EventListener);
    window.addEventListener('client-colors-changed', handleColorChange as EventListener);
    window.addEventListener('teams-display-changed', handleTeamsChange as EventListener);

    return () => {
      window.removeEventListener('async-config-changed', handleConfigChange as EventListener);
      window.removeEventListener('client-colors-changed', handleColorChange as EventListener);
      window.removeEventListener('teams-display-changed', handleTeamsChange as EventListener);
    };
  }, []);
};

// Simple hook for components that need async config
export const useAsyncConfig = () => {
  const { isLoaded, getAsyncMode } = useConfigStore();

  // Auto-load if not loaded
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

// Hook to ensure client colors are loaded
export const useClientColors = () => {
  const { clientColors, isColorsLoaded, getClientColor, loadClientColors } = useConfigStore();

  // Load colors if not already loaded
  React.useEffect(() => {
    if (!isColorsLoaded) {
      loadClientColors();
    }
  }, [isColorsLoaded, loadClientColors]);

  return {
    clientColors,
    isColorsLoaded,
    getClientColor,
  };
};

// Hook to ensure displayed teams are loaded
export const useDisplayedTeams = () => {
  const { displayedTeams, isTeamsLoaded, loadDisplayedTeams } = useConfigStore();

  // Load teams if not already loaded
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
