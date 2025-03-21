import { renderHook, act } from '@testing-library/react-hooks';
import { useWeather } from '../../../hooks/useWeather';
import { weatherService } from '../../../services/weatherService';
import { performanceMonitor } from '../../../utils/performance';

// Mock the weather service
jest.mock('../../../services/weatherService', () => ({
  weatherService: {
    getMultipleCitiesWeather: jest.fn(),
    searchCities: jest.fn(),
    clearCache: jest.fn(),
  },
}));

// Mock the performance monitor
jest.mock('../../../utils/performance', () => ({
  performanceMonitor: {
    trackRenderTime: jest.fn(),
  },
}));

describe('useWeather', () => {
  const mockWeatherData = [
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch initial weather data', async () => {
    (weatherService.getMultipleCitiesWeather as jest.Mock).mockResolvedValueOnce(mockWeatherData);

    const { result } = renderHook(() => useWeather(['London', 'New York']));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);
    expect(result.current.weatherData).toBe(null);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.weatherData).toEqual(mockWeatherData);
    expect(performanceMonitor.trackRenderTime).toHaveBeenCalled();
  });

  it('should handle initial fetch error', async () => {
    const error = new Error('Failed to fetch');
    (weatherService.getMultipleCitiesWeather as jest.Mock).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useWeather(['London']));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(error);
    expect(result.current.weatherData).toBe(null);
  });

  it('should search cities', async () => {
    const mockSearchResults = [mockWeatherData[0]];
    (weatherService.searchCities as jest.Mock).mockResolvedValueOnce(mockSearchResults);

    const { result } = renderHook(() => useWeather([]));

    await act(async () => {
      await result.current.searchCities('London');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.weatherData).toEqual(mockSearchResults);
    expect(weatherService.searchCities).toHaveBeenCalledWith('London');
  });

  it('should handle search errors', async () => {
    const error = new Error('Search failed');
    (weatherService.searchCities as jest.Mock).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useWeather([]));

    await act(async () => {
      await result.current.searchCities('London');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(error);
    expect(result.current.weatherData).toBe(null);
  });

  it('should refresh data', async () => {
    (weatherService.getMultipleCitiesWeather as jest.Mock)
      .mockResolvedValueOnce(mockWeatherData)
      .mockResolvedValueOnce([...mockWeatherData, mockWeatherData[0]]);

    const { result } = renderHook(() => useWeather(['London', 'New York']));

    // Wait for initial fetch
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Refresh data
    await act(async () => {
      await result.current.refreshData();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.weatherData).toHaveLength(3);
  });

  it('should clear cache', async () => {
    const { result } = renderHook(() => useWeather([]));

    await act(async () => {
      result.current.clearCache();
    });

    expect(weatherService.clearCache).toHaveBeenCalled();
    expect(result.current.weatherData).toBe(null);
  });

  it('should handle cache clearing errors', async () => {
    const error = new Error('Cache clear failed');
    (weatherService.clearCache as jest.Mock).mockImplementationOnce(() => {
      throw error;
    });

    const { result } = renderHook(() => useWeather([]));

    await act(async () => {
      result.current.clearCache();
    });

    expect(result.current.error).toBe(error);
  });

  it('should not fetch initial data if no cities provided', async () => {
    const { result } = renderHook(() => useWeather([]));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);
    expect(result.current.weatherData).toBe(null);
    expect(weatherService.getMultipleCitiesWeather).not.toHaveBeenCalled();
  });
}); 