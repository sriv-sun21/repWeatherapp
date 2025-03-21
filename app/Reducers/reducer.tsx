import { WeatherState, WeatherAction, WeatherActionTypes } from '../types/weather.types';

const initialState: WeatherState = {
  data: [],
  isLoading: false,
  error: null
};

const rootReducer = (state: WeatherState = initialState, action: WeatherAction): WeatherState => {
  switch (action.type) {
    case WeatherActionTypes.FETCH_DATA_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case WeatherActionTypes.FETCH_DATA_SUCCESS:
      const hiddenCities = localStorage.getItem('hiddenCities');
      let cities = [];
      if (hiddenCities) {
        cities = JSON.parse(hiddenCities);
      }
      return {
        ...state,
        isLoading: false,
        data: action.payload.map(item => ({
          ...item,
          isHidden: (cities.includes(item.city.name) ? true : false) // Initialize isHidden for new data
        })),
        error: null
      };
    case WeatherActionTypes.FETCH_DATA_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case WeatherActionTypes.UPDATE_DATA:
      return {
        ...state,
        data: state.data.map(item => 
          item.city.name === action.payload.cityName
            ? { ...item, isChecked: action.payload.isChecked }
            : item
        )
      };
    case WeatherActionTypes.TOGGLE_CITY_VISIBILITY:
      return {
        ...state,
        data: state.data.map(item =>
          item.city.name === action.payload
            ? { ...item, isHidden: !item.isHidden }
            : item
        )
      };
    default:
      return state;
  }
};

export default rootReducer; 
