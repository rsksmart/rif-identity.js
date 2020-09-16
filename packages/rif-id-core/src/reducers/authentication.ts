import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface ServiceTokens {
  [serviceDid: string]: string
}

export interface AuthenticationState {
  [identity: string]: ServiceTokens
}

const initialState: AuthenticationState = {}

interface AddServiceTokenPayload {
  identity: string
  serviceDid: string
  token: string
}

interface RemoveServiceTokenPayload {
  identity: string
  serviceDid: string
}

const authenticationSlice = createSlice({
  name: 'authentication',
  initialState,
  reducers: {
    addServiceToken (state: AuthenticationState, { payload: { identity, serviceDid, token } }: PayloadAction<AddServiceTokenPayload>) {
      if (!state[identity]) state[identity] = {}
      state[identity][serviceDid] = token
    },
    removeServiceToken (state: AuthenticationState, { payload: { identity, serviceDid } }: PayloadAction<RemoveServiceTokenPayload>) {
      if (state[identity]) delete state[identity][serviceDid]
    }
  }
})

export const { addServiceToken, removeServiceToken } = authenticationSlice.actions

export const selectServiceTokenByIdentity = (state: AuthenticationState, identity: string, serviceDid: string) => state[identity] && state[identity][serviceDid]

export default authenticationSlice.reducer
