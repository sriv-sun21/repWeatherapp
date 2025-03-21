import { configureStore } from '@reduxjs/toolkit';
import {thunk} from 'redux-thunk';
import rootReducer from '../Reducers/reducer';
import {
    persistStore,
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { Store, AnyAction } from '@reduxjs/toolkit';
import { WeatherState } from '../types/weather.types';

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['rootReducer']
};
   
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
    }).concat(thunk),
});

// Create persistor using type assertion since we know the store shape
export const persistor = persistStore(store as Store<WeatherState, AnyAction>);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;




				
