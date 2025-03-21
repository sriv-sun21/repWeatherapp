import { WeatherData } from '../types/weather.types';
import { NetworkError, BackendError, CacheError } from '../utils/errorHandling';
import { performanceMonitor } from '../utils/performance';
import { CACHE_KEYS, getCachedData, setCachedData } from '../utils/errorHandling';

export class WeatherService {
  private static instance: WeatherService;
  private baseUrl: string;
  private apiKey: string;

  private constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_WEATHER_API_URL || '';
    this.apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY || '';
  }

  public static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit = {},
    retries = 3,
    delay = 1000
  ): Promise<T> {
    try {
      performanceMonitor.incrementNetworkRequests();
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new BackendError(
          `HTTP error! status: ${response.status}`,
          response.status,
          await response.json()
        );
      }

      return await response.json();
    } catch (error) {
      if (retries > 0) {
        const isRetryableError = 
          error instanceof NetworkError || 
          (error instanceof BackendError && error.statusCode !== undefined && error.statusCode >= 500);
        
        if (isRetryableError) {
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.fetchWithRetry(url, options, retries - 1, delay * 2);
        }
      }
      throw error;
    }
  }

  public async getWeatherData(city: string): Promise<WeatherData> {
    try {
      // Check cache first
      const cacheKey = CACHE_KEYS.CITY_DETAILS(city);
      const cachedData = getCachedData<WeatherData>(cacheKey);
      
      if (cachedData) {
        performanceMonitor.incrementCacheHits();
        return cachedData;
      }

      performanceMonitor.incrementCacheMisses();
      const url = `${this.baseUrl}/weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}`;
      
      const data = await this.fetchWithRetry<WeatherData>(url);
      
      // Cache the result
      setCachedData(cacheKey, data);
      
      return data;
    } catch (error) {
      if (error instanceof CacheError) {
        console.error('Cache error:', error);
      }
      throw error;
    }
  }

  public async getMultipleCitiesWeather(cities: string[]): Promise<WeatherData[]> {
    try {
      // Check cache first
      const cachedData = getCachedData<WeatherData[]>(CACHE_KEYS.WEATHER_DATA);
      
      if (cachedData) {
        performanceMonitor.incrementCacheHits();
        return cachedData;
      }

      performanceMonitor.incrementCacheMisses();
      
      // Fetch data for all cities in parallel
      const promises = cities.map(city => this.getWeatherData(city));
      const results = await Promise.allSettled(promises);
      
      const weatherData: WeatherData[] = results
        .filter((result): result is PromiseFulfilledResult<WeatherData> => 
          result.status === 'fulfilled')
        .map(result => result.value);

      // Cache the results
      setCachedData(CACHE_KEYS.WEATHER_DATA, weatherData);
      
      return weatherData;
    } catch (error) {
      if (error instanceof CacheError) {
        console.error('Cache error:', error);
      }
      throw error;
    }
  }

  public async searchCities(query: string): Promise<WeatherData[]> {
    try {
      const url = `${this.baseUrl}/find?q=${encodeURIComponent(query)}&appid=${this.apiKey}`;
      return await this.fetchWithRetry<WeatherData[]>(url);
    } catch (error) {
      if (error instanceof NetworkError) {
        console.error('Network error during city search:', error);
      }
      throw error;
    }
  }

  public clearCache(): void {
    try {
      localStorage.removeItem(CACHE_KEYS.WEATHER_DATA);
      Object.keys(localStorage)
        .filter(key => key.startsWith('city_'))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw new CacheError('Failed to clear cache', error as Error);
    }
  }
}

export const weatherService = WeatherService.getInstance(); 