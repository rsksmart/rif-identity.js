import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CredentialRequestInput } from 'daf-selective-disclosure'

export type Claims = CredentialRequestInput[]

export interface IssuedCredentialRequest {
  from: string
  id: string
  to: string
  claims: Claims
  status: string
}

export interface IssuedCredentialRequestsState {
  [from: string]: IssuedCredentialRequest[]
}

type AddIssuedCredentialRequestPayload = IssuedCredentialRequest

interface SetIssuedCredentialRequestStatusPayload {
  from: string
  id: string
  status: string
}

interface DeleteIssuedCredentialRequestPayload {
  from: string
  id: string
}

const initialState: IssuedCredentialRequestsState = {}

const issuedCredentialRequestSlice = createSlice({
  name: 'issuedCredentialRequest',
  initialState,
  reducers: {
    addIssuedCredentialRequest (state: IssuedCredentialRequestsState, { payload }: PayloadAction<AddIssuedCredentialRequestPayload>) {
      if (!state[payload.from]) state[payload.from] = []
      state[payload.from].push(payload)
    },
    setIssuedCredentialRequestStatus (state: IssuedCredentialRequestsState, { payload: { from, id, status } }: PayloadAction<SetIssuedCredentialRequestStatusPayload>) {
      state[from] = state[from].map(issuedCredentialRequest => issuedCredentialRequest.id === id ? {
        ...issuedCredentialRequest,
        status
      } : issuedCredentialRequest)
    },
    deleteIssuedCredentialRequest (state: IssuedCredentialRequestsState, { payload: { from, id } }: PayloadAction<DeleteIssuedCredentialRequestPayload>) {
      state[from] = state[from].filter(issuedCredentialRequest => issuedCredentialRequest.id !== id)
      if (state[from].length === 0) delete state[from]
    }
  }
})

export const {
  addIssuedCredentialRequest, setIssuedCredentialRequestStatus, deleteIssuedCredentialRequest
} = issuedCredentialRequestSlice.actions

export const selectIssuedCredentialRequests = (state: IssuedCredentialRequestsState, from: string) => state[from]

export default issuedCredentialRequestSlice.reducer
