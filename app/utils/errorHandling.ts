export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}
/* eslint-disable  @typescript-eslint/no-explicit-any */
export class BackendError extends Error {
  constructor(
    message: string, 
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'BackendError';
  }
}

export class CacheError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'CacheError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
/* eslint-disable  @typescript-eslint/no-explicit-any */
export interface ErrorResponse {
  message: string;
  code: string;
  details?: any;
}

export const isOnline = () => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

export const setupOfflineListener = (callback: (isOnline: boolean) => void) => {
  if (typeof window !== 'undefined') {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
};

export const CACHE_KEYS = {
  WEATHER_DATA: 'weather_data',
  CITY_DETAILS: (cityName: string) => `city_${cityName}`,
  LAST_FETCH: 'last_fetch',
  ERROR_COUNT: 'error_count',
};

export const CACHE_DURATION = {
  WEATHER_DATA: 5 * 60 * 1000, // 5 minutes
  CITY_DETAILS: 30 * 60 * 1000, // 30 minutes
  ERROR_COUNT: 60 * 60 * 1000, // 1 hour
};

export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000; // 1 second

export const getCachedData = <T>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp, version } = JSON.parse(cached);
    
    // Check if cache is expired
    const isExpired = Date.now() - timestamp > CACHE_DURATION.WEATHER_DATA;
    if (isExpired) {
      localStorage.removeItem(key);
      return null;
    }

    // Check if cache version matches current app version
    if (version !== process.env.NEXT_PUBLIC_APP_VERSION) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error reading from cache:', error);
    throw new CacheError('Failed to read from cache', error as Error);
  }
};

export const setCachedData = <T>(key: string, data: T): void => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
      version: process.env.NEXT_PUBLIC_APP_VERSION,
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error writing to cache:', error);
    throw new CacheError('Failed to write to cache', error as Error);
  }
};

export const clearCache = (): void => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('weather_') || key.startsWith('city_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    throw new CacheError('Failed to clear cache', error as Error);
  }
};

export const getErrorCount = (): number => {
  try {
    const errorData = localStorage.getItem(CACHE_KEYS.ERROR_COUNT);
    if (!errorData) return 0;

    const { count, timestamp } = JSON.parse(errorData);
    const isExpired = Date.now() - timestamp > CACHE_DURATION.ERROR_COUNT;

    if (isExpired) {
      localStorage.removeItem(CACHE_KEYS.ERROR_COUNT);
      return 0;
    }

    return count;
  } catch {
    return 0;
  }
};

export const incrementErrorCount = (): number => {
  const currentCount = getErrorCount();
  const newCount = currentCount + 1;

  try {
    localStorage.setItem(CACHE_KEYS.ERROR_COUNT, JSON.stringify({
      count: newCount,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Error updating error count:', error);
  }

  return newCount;
};

export const resetErrorCount = (): void => {
  try {
    localStorage.removeItem(CACHE_KEYS.ERROR_COUNT);
  } catch (error) {
    console.error('Error resetting error count:', error);
  }
};

export const shouldRetry = (error: Error): boolean => {
  if (error instanceof NetworkError) return true;
  if (error instanceof BackendError && error.statusCode && error.statusCode >= 500) return true;
  return false;
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
}; 