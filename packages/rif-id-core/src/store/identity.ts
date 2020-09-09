import { combineReducers, configureStore, Reducer, ReducersMapObject, ConfigureStoreOptions } from '@reduxjs/toolkit'
import identityReducer from '../reducers/identitySlice'

const combineIdentityReducer = (reducers: Reducer | ReducersMapObject) => combineReducers({
  identity: identityReducer,
  ...reducers
})

export const configureIdentityStore = (options: ConfigureStoreOptions) => configureStore({
  ...options,
  reducer: combineIdentityReducer(options.reducer)
})
