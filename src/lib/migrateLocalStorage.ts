import { cleanupStorage } from './storage';

/**
 * Migration script to clean up old localStorage keys and migrate to new structure
 * Run this once on app startup
 */
export function migrateLocalStorageToV1(): void {
  console.log('[Migration] Starting localStorage migration to v1...');

  try {
    // Step 1: Migrate old auth keys to new structure
    const oldAccessToken = localStorage.getItem('accessToken');
    const oldRefreshToken = localStorage.getItem('refreshToken');

    if (oldAccessToken || oldRefreshToken) {
      console.log('[Migration] Found old auth tokens, migrating...');

      // Get existing auth-storage if any
      const existingAuthStorage = localStorage.getItem('auth-storage');
      let authData: any = null;

      if (existingAuthStorage) {
        try {
          authData = JSON.parse(existingAuthStorage);
        } catch {
          console.warn('[Migration] Failed to parse existing auth-storage');
        }
      }

      // Create new auth storage with tokens
      const newAuthData = {
        state: {
          user: authData?.state?.user || null,
          accessToken: oldAccessToken,
          refreshToken: oldRefreshToken,
          isAuthenticated: !!(oldAccessToken && authData?.state?.user),
          isLoading: false,
        },
        version: 0,
      };

      // Wrap in storage format
      const wrappedData = {
        data: newAuthData,
        timestamp: Date.now(),
        version: 1,
      };

      localStorage.setItem('auth-storage', JSON.stringify(wrappedData));

      // Remove old tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      console.log('[Migration] Auth tokens migrated successfully');
    }

    // Step 2: Remove deprecated store
    const deprecatedKeys = [
      'matter-traffic-store',
      'JWT_TOKEN',
      'auth-token',
    ];

    deprecatedKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`[Migration] Removing deprecated key: ${key}`);
        localStorage.removeItem(key);
      }
    });

    // Step 3: Clean up invalid/expired entries
    cleanupStorage();

    // Mark migration as complete
    localStorage.setItem('__migration_v1_complete', 'true');

    console.log('[Migration] Migration completed successfully');
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
  }
}

/**
 * Check if migration has already been run
 */
export function needsMigration(): boolean {
  return !localStorage.getItem('__migration_v1_complete');
}

/**
 * Run migration if needed
 */
export function runMigrationIfNeeded(): void {
  if (needsMigration()) {
    migrateLocalStorageToV1();
  }
}
