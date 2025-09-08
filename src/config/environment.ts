const getApiUrl = () => {
  const hostname = window.location.hostname;

  // Développement local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5005/api/v1';
  }

  // Staging (déployé depuis branch staging)
  if (hostname.includes('staging') || hostname.includes('-staging')) {
    return 'https://staging-api.mattertrafficmanager.com/api/v1';
  }

  // Production (déployé depuis branch main)
  if (hostname.includes('mattertraffic.com')) {
    return 'https://api.mattertrafficmanager.com/api/v1';
  }

  // Fallback
  return 'http://localhost:5005/api/v1';
};

export const config = {
  API_URL: getApiUrl(),
  APP_ENV: window.location.hostname === 'localhost' ? 'development' : 'production',
};
