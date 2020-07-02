import { combineReducers } from '@reduxjs/toolkit'
import identityProviders, { IdentityProvidersState } from './identityProviders'

export interface IdentityState {
  identityProviders: IdentityProvidersState
}

const reducer = combineReducers({
  identityProviders
})

// selectors
export const getIdentityProviders = (state: IdentityState) => state.identityProviders

export default reducer
