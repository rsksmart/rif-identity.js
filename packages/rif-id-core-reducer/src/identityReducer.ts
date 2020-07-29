import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface IdentityState {
  did: string
}

export const initialState: IdentityState = {
  did: ''
}

type CreateIdentityPayload = { did: string }

const identitySlice = createSlice({
  name: 'identity',
  initialState,
  reducers: {
    setIdentity: function (state: IdentityState, { payload: { did } }: PayloadAction<CreateIdentityPayload>) {
      if (state.did) throw new Error('Identity already exists')
      state.did = did
    }
  }
})

export const hasIdentity = (state: IdentityState) => state.did !== ''
export const getIdentity = (state: IdentityState) => state.did

export const { name } = identitySlice
export const { setIdentity } = identitySlice.actions

export default identitySlice.reducer
