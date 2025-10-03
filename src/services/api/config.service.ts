import { apiClient } from './client';

export interface Config {
  value: any;
  description?: string;
  dataType: string;
  validValues?: any[];
  category: string;
}

export interface ConfigMap {
  [key: string]: Config;
}

export const configService = {
  /**
   * Get all configs or by category
   */
  async getConfigs(category?: string): Promise<ConfigMap> {
    try {
      const params = category ? { category } : {};
      const response = await apiClient.get('/config', { params });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching configs:', error);
      throw error;
    }
  },

  /**
   * Get a single config value
   */
  async getConfig(key: string): Promise<{ value: any }> {
    try {
      const response = await apiClient.get(`/config/${key}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching config ${key}:`, error);
      throw error;
    }
  },

  /**
   * Update multiple configs
   */
  async updateConfigs(updates: Record<string, any>): Promise<void> {
    try {
      await apiClient.put('/config', updates);
    } catch (error) {
      console.error('Error updating configs:', error);
      throw error;
    }
  },

  /**
   * Initialize default configs
   */
  async initDefaults(): Promise<void> {
    try {
      await apiClient.post('/config/init');
    } catch (error) {
      console.error('Error initializing configs:', error);
      throw error;
    }
  },

  /**
   * Get async mode configs
   */
  async getAsyncModeConfig() {
    const configs = await this.getConfigs('sync');
    return {
      create: configs.ASYNC_MODE_CREATE?.value || false,
      update: configs.ASYNC_MODE_UPDATE?.value || false,
      delete: configs.ASYNC_MODE_DELETE?.value || false,
    };
  },

  /**
   * Update async mode configs
   */
  async updateAsyncModeConfig(config: {
    create: boolean;
    update: boolean;
    delete: boolean;
  }) {
    return this.updateConfigs({
      ASYNC_MODE_CREATE: config.create,
      ASYNC_MODE_UPDATE: config.update,
      ASYNC_MODE_DELETE: config.delete,
    });
  },

  /**
   * Get teams display configuration
   */
  async getTeamsDisplayConfig(): Promise<{
    teams: Array<{
      id: string;
      name: string;
      icon: string;
      color: string;
      order: number;
    }>;
  }> {
    try {
      const response = await apiClient.get('/config/teams-display');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching teams display config:', error);
      throw error;
    }
  },

  /**
   * Update teams display configuration
   */
  async updateTeamsDisplayConfig(teams: Array<{
    id: string;
    icon: string;
    color: string;
    order: number;
  }>): Promise<void> {
    try {
      await apiClient.put('/config/teams-display', { teams });
    } catch (error) {
      console.error('Error updating teams display config:', error);
      throw error;
    }
  }
};