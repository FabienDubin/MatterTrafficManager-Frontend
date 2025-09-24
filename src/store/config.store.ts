import { create } from 'zustand';
import React from 'react';
import { configService } from '@/services/api/config.service';

interface AsyncModeConfig {
  create: boolean;
  update: boolean;
  delete: boolean;
}

interface ConfigStore {
  // State
  asyncMode: AsyncModeConfig;
  isLoaded: boolean;
  isLoading: boolean;
  lastFetched: string | null;
  
  // Actions
  loadAsyncConfig: () => Promise<void>;
  updateAsyncConfig: (config: AsyncModeConfig) => Promise<void>;
  refreshConfig: () => Promise<void>;
  getAsyncMode: () => AsyncModeConfig;
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
  isLoaded: false,
  isLoading: false,
  lastFetched: null,

  // Load config from API (called once at app startup)
  loadAsyncConfig: async () => {
    const { isLoading } = get();
    
    // Prevent multiple concurrent loads
    if (isLoading) return;
    
    set({ isLoading: true });
    
    try {
      const config = await configService.getAsyncModeConfig();
      set({ 
        asyncMode: config,
        isLoaded: true,
        lastFetched: new Date().toISOString()
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
        lastFetched: new Date().toISOString()
      });
      
      // Broadcast change to other components/windows
      window.dispatchEvent(new CustomEvent('async-config-changed', { 
        detail: newConfig 
      }));
    } catch (error) {
      console.error('Failed to update async config:', error);
      throw error;
    }
  },

  // Force refresh from API
  refreshConfig: async () => {
    set({ isLoaded: false });
    await get().loadAsyncConfig();
  },

  // Check if config is stale (older than TTL)
  isConfigStale: () => {
    const { lastFetched } = get();
    if (!lastFetched) return true;
    
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
      console.log('[ConfigStore] Config is stale, refreshing in background...');
      get().loadAsyncConfig(); // Non-blocking background refresh
    }
    
    return asyncMode;
  },
}));

// Hook to auto-load config on app startup
export const useInitConfigStore = () => {
  const { loadAsyncConfig, isLoaded } = useConfigStore();
  
  // Load config once when hook is first used
  React.useEffect(() => {
    if (!isLoaded) {
      loadAsyncConfig();
    }
  }, [loadAsyncConfig, isLoaded]);
  
  // Listen for config changes from other tabs/windows
  React.useEffect(() => {
    const handleConfigChange = (event: CustomEvent) => {
      useConfigStore.setState({ 
        asyncMode: event.detail,
        lastFetched: new Date().toISOString()
      });
    };
    
    window.addEventListener('async-config-changed', handleConfigChange as EventListener);
    
    return () => {
      window.removeEventListener('async-config-changed', handleConfigChange as EventListener);
    };
  }, []);
};

// Simple hook for components that need async config
export const useAsyncConfig = () => {
  const { asyncMode, isLoaded, getAsyncMode } = useConfigStore();
  
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