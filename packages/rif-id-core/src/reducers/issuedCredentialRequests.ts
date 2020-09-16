import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CredentialRequestInput } from 'daf-selective-disclosure'

// use generic type T to customize status possible values - use strings, they are stored in de DB
export type IssuedCredentialRequestStatus<T = 'pending' | 'received' | 'denied' | 'invalid' | 'error'> = T

export type Claims = CredentialRequestInput[]

export interface IssuedCredentialRequest {
  from: string
  messageId: string
  to: string
  claims: Claims
  status: IssuedCredentialRequestStatus
}

export interface IssuedCredentialRequestsState {
  [from: string]: IssuedCredentialRequest[]
}

interface AddIssuedCredentialRequestPayload {
  from: string
  messageId: string
  to: string
  claims: Claims
}

interface SetIssuedCredentialRequestStatusPayload {
  from: string
  messageId: string
  status: IssuedCredentialRequestStatus
}

interface DeleteIssuedCredentialRequestPayload {
  from: string
  messageId: string
}

const initialState: IssuedCredentialRequestsState = {}

const issuedCredentialRequestSlice = createSlice({
  name: 'issuedCredentialRequest',
  initialState,
  reducers: {
    addIssuedCredentialRequest(state: IssuedCredentialRequestsState, { payload }: PayloadAction<AddIssuedCredentialRequestPayload>) {
      if (!state[payload.from]) state[payload.from] = []
      state[payload.from].push({
        ...payload,
        status: 'pending'
      })
    },
    setIssuedCredentialRequestStatus(state: IssuedCredentialRequestsState, { payload: { from, messageId, status } }: PayloadAction<SetIssuedCredentialRequestStatusPayload>) {
      state[from] = state[from].map(issuedCredentialRequest => issuedCredentialRequest.messageId === messageId ? {
        ...issuedCredentialRequest,
        status
      } : issuedCredentialRequest)
    },
    deleteIssuedCredentialRequest(state: IssuedCredentialRequestsState, { payload: { from, messageId } }: PayloadAction<DeleteIssuedCredentialRequestPayload>) {
      state[from] = state[from].filter(issuedCredentialRequest => issuedCredentialRequest.messageId !== messageId)
      if (state[from].length === 0) delete state[from]
    }
  }
})

export const {
  addIssuedCredentialRequest, setIssuedCredentialRequestStatus, deleteIssuedCredentialRequest
} = issuedCredentialRequestSlice.actions

export const selectIssuedCredentialRequests = (state: IssuedCredentialRequestsState, from: string) => state[from]

export default issuedCredentialRequestSlice.reducer
