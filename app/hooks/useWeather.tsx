import { useState, useEffect, useCallback } from 'react';
import { WeatherData } from '../types/weather.types';
import { weatherService } from '../services/weatherService';
import { performanceMonitor } from '../utils/performance';
import { debounce } from '../utils/performance';

interface UseWeatherReturn {
  weatherData: WeatherData[] | null;
  isLoading: boolean;
  error: Error | null;
  searchCities: (query: string) => Promise<void>;
  refreshData: () => Promise<void>;
  clearCache: () => void;
}

export const useWeather = (initialCities: string[] = []): UseWeatherReturn => {
  const [weatherData, setWeatherData] = useState<WeatherData[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWeatherData = useCallback(async (cities: string[]) => {
    try {
      setIsLoading(true);
      setError(null);
      const startTime = performance.now();

      const data = await weatherService.getMultipleCitiesWeather(cities);
      setWeatherData(data);

      performanceMonitor.trackRenderTime('WeatherData', startTime);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching weather data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const performSearch = useCallback(async (query: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const startTime = performance.now();

      const results = await weatherService.searchCities(query);
      setWeatherData(results);

      performanceMonitor.trackRenderTime('CitySearch', startTime);
    } catch (err) {
      setError(err as Error);
      console.error('Error searching cities:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchCities = useCallback(
    (query: string): Promise<void> => {
      return new Promise((resolve) => {
        const debouncedSearch = debounce(async () => {
          await performSearch(query);
          resolve();
        }, 300);
        debouncedSearch();
      });
    },
    [performSearch]
  );

  const refreshData = useCallback(async () => {
    if (weatherData) {
      const cities = weatherData.map(data => data.city.name);
      await fetchWeatherData(cities);
    }
  }, [weatherData, fetchWeatherData]);

  const clearCache = useCallback(() => {
    try {
      weatherService.clearCache();
      setWeatherData(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error clearing cache:', err);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (initialCities.length > 0) {
      fetchWeatherData(initialCities);
    }
  }, [initialCities, fetchWeatherData]);

  return {
    weatherData,
    isLoading,
    error,
    searchCities,
    refreshData,
    clearCache,
  };
}; 