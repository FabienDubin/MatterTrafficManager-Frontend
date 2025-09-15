/**
 * Configuration de l'application
 * Note: On n'utilise PAS de variables d'environnement car Azure + Vite 
 * ne les gèrent pas correctement en production avec un build statique
 */

// Détection de l'environnement basée sur l'URL
const getEnvironment = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  }
  
  if (hostname.includes('staging') || hostname.includes('test')) {
    return 'staging';
  }
  
  return 'production';
};

const environment = getEnvironment();

// Configuration par environnement
const configs = {
  development: {
    API_URL: 'http://localhost:5005',
    API_TIMEOUT: 10000,
    JWT_STORAGE_KEY: 'matter_traffic_token',
    ENABLE_DEV_TOOLS: true,
    LOG_LEVEL: 'debug'
  },
  staging: {
    API_URL: 'https://staging-api.mattertraffic.com',
    API_TIMEOUT: 30000,
    JWT_STORAGE_KEY: 'matter_traffic_token',
    ENABLE_DEV_TOOLS: false,
    LOG_LEVEL: 'info'
  },
  production: {
    API_URL: 'https://api.mattertraffic.com',
    API_TIMEOUT: 30000,
    JWT_STORAGE_KEY: 'matter_traffic_token',
    ENABLE_DEV_TOOLS: false,
    LOG_LEVEL: 'error'
  }
};

// Export de la configuration active
export const AppConfig = {
  ...configs[environment],
  ENVIRONMENT: environment,
  IS_DEV: environment === 'development',
  IS_PROD: environment === 'production',
  IS_STAGING: environment === 'staging'
};

// Fonction helper pour logger en dev
export const devLog = (...args: any[]) => {
  if (AppConfig.IS_DEV && AppConfig.LOG_LEVEL === 'debug') {
    console.log('[DEV]', ...args);
  }
};