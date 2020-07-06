import { combineReducers } from '@reduxjs/toolkit'
import identityProviders, { IdentityProvidersState } from './identityProviders'
import issuedCredentials from './issuedCredentials'

export interface IdentityState {
  identityProviders: IdentityProvidersState
}

export default combineReducers({
  identityProviders
})

// selectors
export const getIdentityProviders = (state: IdentityState) => state.identityProviders

export const issuerReducer = combineReducers({
  identityProviders,
  issuedCredentials
})
