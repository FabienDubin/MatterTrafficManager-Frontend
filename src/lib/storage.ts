import { StateStorage } from 'zustand/middleware';

/**
 * Storage configuration options
 */
interface StorageOptions {
  /** Time to live in milliseconds. If set, stored data expires after this duration */
  ttl?: number;
  /** Validation function to check if stored data is valid before loading */
  validate?: (data: any) => boolean;
  /** Storage key prefix to namespace the storage */
  prefix?: string;
}

/**
 * Storage wrapper with TTL and validation support
 */
interface StorageItem<T = any> {
  data: T;
  timestamp: number;
  version: number;
}

/**
 * Current storage version - increment this when making breaking changes to storage structure
 */
const STORAGE_VERSION = 1;

/**
 * Create a custom storage with TTL and validation
 *
 * @param options - Storage configuration
 * @returns StateStorage compatible with Zustand persist middleware
 *
 * @example
 * ```ts
 * const storage = createStorage({
 *   ttl: 3600000, // 1 hour
 *   validate: (data) => data.user !== null,
 *   prefix: 'app'
 * });
 *
 * const useStore = create(
 *   persist(
 *     (set) => ({ user: null }),
 *     { name: 'auth', storage }
 *   )
 * );
 * ```
 */
export function createStorage(options: StorageOptions = {}): StateStorage {
  const { ttl, validate, prefix = '' } = options;

  return {
    getItem: (name: string): string | null => {
      try {
        const key = prefix ? `${prefix}-${name}` : name;
        const item = localStorage.getItem(key);

        if (!item) {
          return null;
        }

        const parsed: StorageItem = JSON.parse(item);

        // Check version compatibility
        if (parsed.version !== STORAGE_VERSION) {
          console.warn(`[Storage] Version mismatch for ${key}, clearing data`);
          localStorage.removeItem(key);
          return null;
        }

        // Check TTL expiration
        if (ttl && parsed.timestamp) {
          const age = Date.now() - parsed.timestamp;
          if (age > ttl) {
            console.warn(`[Storage] Data expired for ${key}, clearing`);
            localStorage.removeItem(key);
            return null;
          }
        }

        // Run custom validation if provided
        if (validate && !validate(parsed.data)) {
          console.warn(`[Storage] Validation failed for ${key}, clearing`);
          localStorage.removeItem(key);
          return null;
        }

        // Return the raw data as string (Zustand will parse it)
        return JSON.stringify(parsed.data);
      } catch (error) {
        console.error(`[Storage] Failed to get item:`, error);
        return null;
      }
    },

    setItem: (name: string, value: string) => {
      try {
        const key = prefix ? `${prefix}-${name}` : name;

        // Zustand passes a string, parse it to get the actual data
        let parsedValue;
        try {
          parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
        } catch {
          // If parsing fails, use value as-is
          parsedValue = value;
        }

        const item: StorageItem = {
          data: parsedValue,
          timestamp: Date.now(),
          version: STORAGE_VERSION,
        };

        localStorage.setItem(key, JSON.stringify(item));
      } catch (error) {
        console.error(`[Storage] Failed to set item:`, error);
      }
    },

    removeItem: (name: string) => {
      try {
        const key = prefix ? `${prefix}-${name}` : name;
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`[Storage] Failed to remove item:`, error);
      }
    },
  };
}

/**
 * Clean up expired or invalid storage items
 *
 * @param prefix - Only clean items with this prefix (optional)
 */
export function cleanupStorage(prefix?: string): void {
  try {
    const keysToRemove: string[] = [];

    // Iterate through all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Filter by prefix if specified
      if (prefix && !key.startsWith(prefix)) {
        continue;
      }

      try {
        const item = localStorage.getItem(key);
        if (!item) continue;

        const parsed: StorageItem = JSON.parse(item);

        // Remove if version mismatch
        if (parsed.version !== STORAGE_VERSION) {
          keysToRemove.push(key);
          continue;
        }

        // Remove if no data
        if (!parsed.data) {
          keysToRemove.push(key);
        }
      } catch {
        // Invalid JSON, mark for removal
        keysToRemove.push(key);
      }
    }

    // Remove invalid keys
    keysToRemove.forEach(key => {
      console.log(`[Storage] Cleaning up invalid key: ${key}`);
      localStorage.removeItem(key);
    });

    console.log(`[Storage] Cleanup complete. Removed ${keysToRemove.length} items.`);
  } catch (error) {
    console.error(`[Storage] Cleanup failed:`, error);
  }
}

/**
 * Migrate from old storage keys to new ones
 *
 * @param migrations - Map of old key to new key
 *
 * @example
 * ```ts
 * migrateStorage({
 *   'old-auth-key': 'auth-storage',
 *   'old-user-key': null, // delete without migrating
 * });
 * ```
 */
export function migrateStorage(migrations: Record<string, string | null>): void {
  Object.entries(migrations).forEach(([oldKey, newKey]) => {
    try {
      const oldValue = localStorage.getItem(oldKey);

      if (oldValue) {
        if (newKey) {
          // Migrate to new key
          console.log(`[Storage] Migrating ${oldKey} → ${newKey}`);
          localStorage.setItem(newKey, oldValue);
        }

        // Remove old key
        localStorage.removeItem(oldKey);
      }
    } catch (error) {
      console.error(`[Storage] Migration failed for ${oldKey}:`, error);
    }
  });
}
