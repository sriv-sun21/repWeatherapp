'use client';
import {ReactNode} from 'react';
import { Provider } from "react-redux";
import store , {persistor} from './Store/store';
import { PersistGate } from 'redux-persist/integration/react';
interface Props {
    children?: ReactNode
    // any props that come into the component
}
/* eslint-disable  @typescript-eslint/no-unused-variable */
export function Providers ({ children, ...props }: Props) {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                {children}
            </PersistGate>
        </Provider>
    )
}
