export interface AppConfig {
  api: {
    baseUrl: string;
    apiKey: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  cache: {
    weatherDataTTL: number;
    cityDetailsTTL: number;
    errorCountTTL: number;
    maxErrorCount: number;
  };
  performance: {
    debounceDelay: number;
    throttleDelay: number;
    longTaskThreshold: number;
    slowRenderThreshold: number;
  };
  ui: {
    defaultCities: string[];
    maxSearchResults: number;
    imageQuality: 'low' | 'medium' | 'high';
    theme: 'light' | 'dark' | 'system';
  };
}

const config: AppConfig = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_WEATHER_API_URL || '',
    apiKey: process.env.NEXT_PUBLIC_WEATHER_API_KEY || '',
    timeout: 10000, // 10 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },
  cache: {
    weatherDataTTL: 5 * 60 * 1000, // 5 minutes
    cityDetailsTTL: 30 * 60 * 1000, // 30 minutes
    errorCountTTL: 60 * 60 * 1000, // 1 hour
    maxErrorCount: 5,
  },
  performance: {
    debounceDelay: 300,
    throttleDelay: 500,
    longTaskThreshold: 50, // 50ms
    slowRenderThreshold: 100, // 100ms
  },
  ui: {
    defaultCities: ['Budapest', 'New York', 'Tokyo', 'San Francisco', 'Hong Kong'],
    maxSearchResults: 10,
    imageQuality: 'medium',
    theme: 'system',
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_WEATHER_API_URL',
  'NEXT_PUBLIC_WEATHER_API_KEY',
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

export default config; 