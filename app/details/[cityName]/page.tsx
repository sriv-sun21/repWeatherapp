'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux';
import { fetchData } from '../../Actions/action';
import { RootState } from '../../Store/store';
import { WeatherData } from '../../types/weather.types';
import { AppDispatch } from '../../Store/store';
import { dateTimeConverter, temeratureCalc } from '../../utils/utils';
import { useRouter } from 'next/navigation';
import {
  NetworkError,
  BackendError,
  CacheError,
  ValidationError,
  isOnline,
  setupOfflineListener,
  CACHE_KEYS,
  setCachedData,
  incrementErrorCount,
  resetErrorCount,
  shouldRetry,
  sleep,
  MAX_RETRIES,
  RETRY_DELAY,
  getCachedData
} from '../../utils/errorHandling';

interface Temperature {
  C: string;
  F: string;
  K: string;
}

export default function CityDetailsPage() {
  const params = useParams<{
    cityName: string; tag: string; item: string 
}>();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { data, isLoading, error } = useSelector((state: RootState) => state);
  const [cityData, setCityData] = useState<WeatherData | null>(null);
  const [temperatures, setTemperatures] = useState<Temperature>({ C: '', F: '', K: '' });
  const [formattedDate, setFormattedDate] = useState<Date>(new Date());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Setup offline listener
  useEffect(() => {
    const cleanup = setupOfflineListener((online) => {
      setIsOffline(!online);
      if (online) {
        loadData();
      }
    });
    return cleanup;
  }, []);

  // Fetch data on component mount
  const loadData = async () => {
    try {
      // Check cache first
      const cachedData = getCachedData<WeatherData[]>(CACHE_KEYS.WEATHER_DATA);
      if (cachedData) {
        const city = cachedData.find((c: WeatherData) => 
          c.city.name.replace(/\s+/g, '') === params.cityName
        );
        if (city) {
          setCityData(city);
          setTemperatures(temeratureCalc(parseInt(city.temp), city.tempType));
          setFormattedDate(dateTimeConverter(city.date));
          resetErrorCount();
          return;
        }
      }

      // If not in cache or expired, fetch from API with retry logic
      let lastError: Error | null = null;
      for (let i = 0; i < MAX_RETRIES; i++) {
        try {
          await dispatch(fetchData());
          resetErrorCount();
          return;
        } catch (err) {
          lastError = err as Error;
          if (!shouldRetry(lastError)) {
            break;
          }
          setRetryCount(i + 1);
          await sleep(RETRY_DELAY * (i + 1)); // Exponential backoff
        }
      }

      throw lastError;
    } catch (err) {
      console.error('Error fetching data:', err);
      const errorCount = incrementErrorCount();
      
      if (err instanceof NetworkError) {
        setErrorMessage('No internet connection. Please check your connection and try again.');
      } else if (err instanceof BackendError) {
        setErrorMessage(`Server error (${err.statusCode}). Please try again later.`);
      } else if (err instanceof CacheError) {
        setErrorMessage('Error accessing cached data. Please try again.');
      } else if (err instanceof ValidationError) {
        setErrorMessage(`Invalid data: ${err.message}`);
      } else {
        setErrorMessage('An unexpected error occurred. Please try again later.');
      }

      // If we've had too many errors, redirect to home
      if (errorCount >= MAX_RETRIES) {
        router.push('/');
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [dispatch, router]);

  // Update city data when data is loaded
  useEffect(() => {
    if (data && isInitialLoad) {
      const city = data.find((c: WeatherData) => 
        c.city.name.replace(/\s+/g, '') === params.cityName
      );
      
      if (city) {
        setCityData(city);
        setTemperatures(temeratureCalc(parseInt(city.temp), city.tempType));
        setFormattedDate(dateTimeConverter(city.date));
        // Cache the data
        setCachedData(CACHE_KEYS.WEATHER_DATA, data);
      }
      setIsInitialLoad(false);
    }
  }, [data, params.cityName, isInitialLoad]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">
            {retryCount > 0 
              ? `Loading weather data... (Attempt ${retryCount + 1}/${MAX_RETRIES})`
              : 'Loading weather data...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || errorMessage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-lg max-w-md" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">Error loading weather data</p>
              <p className="mt-2 text-sm">{errorMessage || error}</p>
              {isOffline && (
                <p className="mt-2 text-sm text-yellow-600">
                  You are currently offline. Please check your internet connection.
                </p>
              )}
              {retryCount > 0 && (
                <p className="mt-2 text-sm text-blue-600">
                  Retrying... (Attempt {retryCount + 1}/{MAX_RETRIES})
                </p>
              )}
              <button 
                onClick={() => router.push('/')}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cityData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">City Not Found</h2>
          <p className="text-gray-600 mb-4">The requested city could not be found.</p>
          {isOffline && (
            <p className="text-sm text-yellow-600 mb-4">
              You are currently offline. Some data may be unavailable.
            </p>
          )}
          <button 
            onClick={() => router.push('/')}
            className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {isOffline && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg mb-4" role="alert">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">You are currently offline. Showing cached data.</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="relative h-64">
              <img 
                src={cityData.city.picture} 
                alt={cityData.city.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h1 className="text-3xl font-bold text-white mb-2">{cityData.city.name}</h1>
                <p className="text-white/90">{formattedDate.toString()}</p>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Celsius</h3>
                  <p className="text-2xl font-bold text-blue-600">{temperatures.C}°C</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Fahrenheit</h3>
                  <p className="text-2xl font-bold text-green-600">{temperatures.F}°F</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">Kelvin</h3>
                  <p className="text-2xl font-bold text-purple-600">{temperatures.K}K</p>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button 
                onClick={() => router.push('/')}
                className="inline-block bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
