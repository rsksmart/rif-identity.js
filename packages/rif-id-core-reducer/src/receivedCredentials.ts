import { PayloadAction, createSlice, Dispatch } from '@reduxjs/toolkit'

export interface Credential {
  hash: string
  issuer: string
  subject?: string
  id?: string
  issuanceDate: Date
  expirationDate?: Date
  context: string[]
  type: string[]
  claims: object
}

export interface ReceivedCredentialsState {
  credentials: Credential[]
}

interface ReceivedCredentialPayload {
  credential: Credential,
}

export const initialState: ReceivedCredentialsState = {
  credentials: []
}

const receivedCredentialsSlice = createSlice({
  name: 'receivedCredentials',
  initialState,
  reducers: {
    addCredential (state: ReceivedCredentialsState, { payload: { credential } }: PayloadAction<ReceivedCredentialPayload>) {
      if (hasCredentials(state)) {
        state.credentials.push(credential)
      } else {
        state.credentials = [credential]
      }
    }
  }
})

export const { addCredential } = receivedCredentialsSlice.actions

export const hasCredentials = (state: ReceivedCredentialsState) => !!state.credentials.length
export const getAllCredentials = (state: ReceivedCredentialsState) => state.credentials
export const hasCredentialsByDID = (state: ReceivedCredentialsState, did: string) => !!state.credentials.filter(c => c.subject === did).length
export const getCredentialsByDID = (state: ReceivedCredentialsState, did: string) => state.credentials.filter(c => c.subject === did)
export const getCredentialById = (state: ReceivedCredentialsState, id: string) => state.credentials.find(c => c.id === id)

type AddReceivedCredentialBySubject = (dispatch: Dispatch) => (credential: Credential) => void

export const addReceivedCredential: AddReceivedCredentialBySubject = (dispatch) => (credential) => {
  dispatch(addCredential({ credential }))
}

export default receivedCredentialsSlice.reducer
