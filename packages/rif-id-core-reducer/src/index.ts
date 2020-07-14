import { combineReducers } from '@reduxjs/toolkit'
import identityProviders, { IdentityProvidersState } from './identityProviders'
import receivedCredentials from './receivedCredentials'

export interface IdentityState {
  identityProviders: IdentityProvidersState
}

const reducer = combineReducers({
  identityProviders
})

// selectors
export const getIdentityProviders = (state: IdentityState) => state.identityProviders

export default reducer

export const holderReducer = combineReducers({
  identityProviders,
  receivedCredentials
})
