export interface WeatherData {
  city: {
    name: string;
    picture: string;
  };
  date: string;
  temp: string;
  tempType: string;
  isHidden?: boolean;
}

export interface WeatherState {
  data: WeatherData[];
  isLoading: boolean;
  error: string | null;
}

export enum WeatherActionTypes {
  FETCH_DATA_REQUEST = 'FETCH_DATA_REQUEST',
  FETCH_DATA_SUCCESS = 'FETCH_DATA_SUCCESS',
  FETCH_DATA_FAILURE = 'FETCH_DATA_FAILURE',
  UPDATE_DATA = 'UPDATE_DATA',
  TOGGLE_CITY_VISIBILITY = 'TOGGLE_CITY_VISIBILITY'
}

export interface FetchDataRequestAction {
  type: WeatherActionTypes.FETCH_DATA_REQUEST;
}

export interface FetchDataSuccessAction {
  type: WeatherActionTypes.FETCH_DATA_SUCCESS;
  payload: WeatherData[];
}

export interface FetchDataFailureAction {
  type: WeatherActionTypes.FETCH_DATA_FAILURE;
  payload: string;
}

export interface UpdateDataAction {
  type: WeatherActionTypes.UPDATE_DATA;
  payload: {
    cityName: string;
    isChecked: boolean;
  };
}

export interface ToggleCityVisibilityAction {
  type: WeatherActionTypes.TOGGLE_CITY_VISIBILITY;
  payload: string;
}

export const ENDPOINT_API = process.env.NODE_ENV === 'development' 
  ? '/api/weather' 
  : '/.netlify/functions/weather';

export type WeatherAction =
  | FetchDataRequestAction
  | FetchDataSuccessAction
  | FetchDataFailureAction
  | UpdateDataAction
  | ToggleCityVisibilityAction; 

async function getCityTemperatures(cityName) {
    try {
        const response = await fetch(`/api/temperatures?city=${encodeURIComponent(cityName)}`);
        const data = await response.json();
        
        if (data.error) {
            console.error('Error:', data.error);
            return;
        }
        
        return data;
    } catch (error) {
        console.error('Failed to fetch temperatures:', error);
    }
} 
