'use client';
import React, {useEffect, useState, useRef} from 'react'
import Link from 'next/link'
import { useDispatch, useSelector } from 'react-redux';
import { fetchData, toggleCityVisibility } from '../Actions/action';
import { RootState } from '../Store/store';
import { WeatherData } from '../types/weather.types';
import { AppDispatch } from '../Store/store';

const Home = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, isLoading, error } = useSelector((state: RootState) => state);
  const hideButtonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchData());
  }, [dispatch]);

  // Load hidden cities from localStorage on component mount
  useEffect(() => {
    const hiddenCities = localStorage.getItem('hiddenCities');
    if (hiddenCities) {
      const cities = JSON.parse(hiddenCities);
      cities.forEach((cityName: string) => {
        dispatch(toggleCityVisibility(cityName));
      });
    }
  }, [dispatch]);

  const handleToggleVisibility = (cityName: string) => {
    dispatch(toggleCityVisibility(cityName));
    
    // Update localStorage
    const hiddenCities = localStorage.getItem('hiddenCities');
    const cities = hiddenCities ? JSON.parse(hiddenCities) : [];
    
    if (data) {
      const city = data.find((c: WeatherData) => c.city.name === cityName);
      if (city) {
        if (!city.isHidden) {
          // Add to hidden cities if not already present
          if (!cities.includes(cityName)) {
            cities.push(cityName);
          }
        } else {
          // Remove from hidden cities
          const index = cities.indexOf(cityName);
          if (index > -1) {
            cities.splice(index, 1);
          }
        }
        localStorage.setItem('hiddenCities', JSON.stringify(cities));
      }
    }
  };
  

  const setButtonRef = (index: number) => (ref: HTMLButtonElement | null) => {
    hideButtonRefs.current[index] = ref;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading weather data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isCorsError = error.includes('cors-anywhere.herokuapp.com');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-lg max-w-2xl" role="alert">
          <div className="flex flex-col">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-lg font-medium">Error loading weather data</p>
                <p className="mt-2 text-sm">{error}</p>
              </div>
            </div>
            {isCorsError && (
              <div className="mt-4">
                <a 
                  href="https://cors-anywhere.herokuapp.com/corsdemo" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Request Temporary Access
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="container mx-auto px-4">
        <div className="text-center mb-2">
          <p className="text-blue-600">Click on any city to view detailed weather information</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data && data.map((post: WeatherData, index: number) => (
            <div 
              key={index} 
              className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 transform hover:scale-105 ${
                post.isHidden ? 'opacity-50' : 'opacity-100'
              }`}
              onMouseEnter={() => setHoveredCity(post.city.name)}
              onMouseLeave={() => setHoveredCity(null)}
            >
              <div className='p-4 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50'>
                <span className={`text-xl font-semibold ${post.isHidden ? 'text-gray-400' : 'text-gray-800'}`}>
                  {post.city.name}
                </span>
                <button 
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                    post.isHidden 
                      ? 'bg-green-500 hover:bg-green-600 text-white shadow-md' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md'
                  }`}
                  type="button"
                  ref={setButtonRef(index)}
                  onClick={() => handleToggleVisibility(post.city.name)}
                >
                  {post.isHidden ? 'Show City' : 'Hide City'}
                </button>
              </div>
              <Link href={{
                pathname: `/details/${post.city.name.replace(/\s+/g, '')}`
              }}>
                <div className="relative h-48 overflow-hidden group">
                  <img 
                    className={`object-cover w-full h-full transition-all duration-300 ${
                      post.isHidden ? 'grayscale' : ''
                    } ${hoveredCity === post.city.name ? 'scale-110' : ''}`}
                    src={post.city.picture} 
                    alt={post.city.name} 
                  />
                  {post.isHidden && (
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                      <span className="text-white font-medium">Hidden</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                    <span className="text-white p-4 text-lg font-medium">View Details →</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}   
        </div>
      </div>
    </div>
  );
}

export default Home;



