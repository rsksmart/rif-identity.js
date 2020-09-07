import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface IdentityState {
  identities: string[]
}

interface AddIdentityPayload {
  did: string
}

const initialState: IdentityState = {
  identities: []
}

const identitySlice = createSlice({
  name: 'identity',
  initialState,
  reducers: {
    addIdentity (state: IdentityState, { payload: { did } }: PayloadAction<AddIdentityPayload>) {
      state.identities.push(did)
    },
    deleteIdentity (state: IdentityState, { payload: { did } }: PayloadAction<AddIdentityPayload>) {
      state.identities = state.identities.filter(id => id !== did)
    },
    deleteAllIdentities: (state: IdentityState) => {
      state.identities = []
    }
  }
})

export const { addIdentity, deleteIdentity, deleteAllIdentities } = identitySlice.actions

export const selectIdentities = (state: IdentityState) => state.identities

export default identitySlice.reducer
