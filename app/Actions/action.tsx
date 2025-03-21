import { 
  WeatherActionTypes, 
  FetchDataRequestAction, 
  FetchDataSuccessAction, 
  FetchDataFailureAction, 
  UpdateDataAction,
  ToggleCityVisibilityAction,
  WeatherData,
  ENDPOINT_API
} from '../types/weather.types';
import { AppDispatch } from '../Store/store';
import axios from 'axios';

export const fetchDataRequest = (): FetchDataRequestAction => ({
  type: WeatherActionTypes.FETCH_DATA_REQUEST
});

export const fetchDataSuccess = (data: WeatherData[]): FetchDataSuccessAction => ({
  type: WeatherActionTypes.FETCH_DATA_SUCCESS,
  payload: data
});

export const fetchDataFailure = (error: string): FetchDataFailureAction => ({
  type: WeatherActionTypes.FETCH_DATA_FAILURE,
  payload: error
});

export const updateData = (cityName: string, isChecked: boolean): UpdateDataAction => ({
  type: WeatherActionTypes.UPDATE_DATA,
  payload: { cityName, isChecked }
});

export const toggleCityVisibility = (cityName: string): ToggleCityVisibilityAction => ({
  type: WeatherActionTypes.TOGGLE_CITY_VISIBILITY,
  payload: cityName
});

export const fetchData = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(fetchDataRequest());
    const response = await axios.get(ENDPOINT_API);
    const duplicateSetRemoval = new Set();
    const data = response.data;
    const filteredArr = data.filter((element: { city: { name: unknown; }; }) => {
        const duplicateCity = duplicateSetRemoval.has(element.city.name);
        duplicateSetRemoval.add(element.city.name);
        return !duplicateCity;
    });
    // sorting of the cities alphabetically
    filteredArr.sort((firstItem: { city: { name: string; }; }, secondItem: { city: { name: string; }; }) => 
        firstItem.city.name.toLowerCase().localeCompare(secondItem.city.name.toLowerCase())
    );
    dispatch(fetchDataSuccess(filteredArr));
  } catch (error) {
    dispatch(fetchDataFailure(error instanceof Error ? error.message : 'An error occurred'));
  }
}; 
