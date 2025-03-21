import { weatherService } from '../../../services/weatherService';
import { NetworkError, BackendError, CacheError } from '../../../utils/errorHandling';
import { performanceMonitor } from '../../../utils/performance';

// Mock the performance monitor
jest.mock('../../../utils/performance', () => ({
  performanceMonitor: {
    incrementNetworkRequests: jest.fn(),
    incrementCacheHits: jest.fn(),
    incrementCacheMisses: jest.fn(),
  },
}));

describe('WeatherService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('getWeatherData', () => {
    it('should fetch weather data successfully', async () => {
      const city = 'London';
      const mockData = {
        city: {
          name: 'London',
          picture: 'https://example.com/london.jpg',
        },
        temp: '20',
        tempType: 'C',
        date: new Date().toISOString(),
        isHidden: false,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await weatherService.getWeatherData(city);

      expect(result).toEqual(mockData);
      expect(performanceMonitor.incrementNetworkRequests).toHaveBeenCalled();
      expect(performanceMonitor.incrementCacheMisses).toHaveBeenCalled();
      expect(performanceMonitor.incrementCacheHits).not.toHaveBeenCalled();
    });

    it('should return cached data if available', async () => {
      const city = 'London';
      const mockData = {
        city: {
          name: 'London',
          picture: 'https://example.com/london.jpg',
        },
        temp: '20',
        tempType: 'C',
        date: new Date().toISOString(),
        isHidden: false,
      };

      // Set up cache
      localStorage.setItem(`city_${city}`, JSON.stringify(mockData));

      const result = await weatherService.getWeatherData(city);

      expect(result).toEqual(mockData);
      expect(performanceMonitor.incrementCacheHits).toHaveBeenCalled();
      expect(performanceMonitor.incrementCacheMisses).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      const city = 'London';
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(weatherService.getWeatherData(city)).rejects.toThrow(NetworkError);
    });

    it('should handle backend errors', async () => {
      const city = 'London';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal server error' }),
      });

      await expect(weatherService.getWeatherData(city)).rejects.toThrow(BackendError);
    });
  });

  describe('getMultipleCitiesWeather', () => {
    it('should fetch weather data for multiple cities', async () => {
      const cities = ['London', 'New York'];
      const mockData = [
        {
          city: {
            name: 'London',
            picture: 'https://example.com/london.jpg',
          },
          temp: '20',
          tempType: 'C',
          date: new Date().toISOString(),
          isHidden: false,
        },
        {
          city: {
            name: 'New York',
            picture: 'https://example.com/newyork.jpg',
          },
          temp: '25',
          tempType: 'C',
          date: new Date().toISOString(),
          isHidden: false,
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockData[0]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockData[1]),
        });

      const result = await weatherService.getMultipleCitiesWeather(cities);

      expect(result).toEqual(mockData);
      expect(performanceMonitor.incrementNetworkRequests).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures', async () => {
      const cities = ['London', 'Error', 'New York'];
      const mockData = [
        {
          city: {
            name: 'London',
            picture: 'https://example.com/london.jpg',
          },
          temp: '20',
          tempType: 'C',
          date: new Date().toISOString(),
          isHidden: false,
        },
        {
          city: {
            name: 'New York',
            picture: 'https://example.com/newyork.jpg',
          },
          temp: '25',
          tempType: 'C',
          date: new Date().toISOString(),
          isHidden: false,
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockData[0]),
        })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockData[1]),
        });

      const result = await weatherService.getMultipleCitiesWeather(cities);

      expect(result).toEqual([mockData[0], mockData[1]]);
      expect(result.length).toBe(2);
    });
  });

  describe('searchCities', () => {
    it('should search cities successfully', async () => {
      const query = 'London';
      const mockResults = [
        {
          city: {
            name: 'London',
            picture: 'https://example.com/london.jpg',
          },
          temp: '20',
          tempType: 'C',
          date: new Date().toISOString(),
          isHidden: false,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResults),
      });

      const result = await weatherService.searchCities(query);

      expect(result).toEqual(mockResults);
      expect(performanceMonitor.incrementNetworkRequests).toHaveBeenCalled();
    });

    it('should handle search errors', async () => {
      const query = 'error';
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(weatherService.searchCities(query)).rejects.toThrow(NetworkError);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', () => {
      // Set up some cache data
      localStorage.setItem('weather_data', JSON.stringify({}));
      localStorage.setItem('city_London', JSON.stringify({}));
      localStorage.setItem('city_NewYork', JSON.stringify({}));

      weatherService.clearCache();

      expect(localStorage.getItem('weather_data')).toBeNull();
      expect(localStorage.getItem('city_London')).toBeNull();
      expect(localStorage.getItem('city_NewYork')).toBeNull();
    });

    it('should handle cache clearing errors', () => {
      // Mock localStorage to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => weatherService.clearCache()).toThrow(CacheError);

      // Restore original implementation
      localStorage.setItem = originalSetItem;
    });
  });
}); 