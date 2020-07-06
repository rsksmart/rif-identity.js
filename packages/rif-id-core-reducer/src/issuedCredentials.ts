import { createSlice, PayloadAction, Dispatch } from '@reduxjs/toolkit'

export interface IssuedCredentialState {
  jwt: string,
}

export interface SubjectCredentialsState {
  [subject: string]: IssuedCredentialState[]
}

export interface IssuedCredentialsState {
  credentials: SubjectCredentialsState
}

interface IssuedCredentialPayload {
  subject: string,
  credential: IssuedCredentialState,
}

export const initialState: IssuedCredentialsState = {
  credentials: {}
}

const issuedCredentialsSlice = createSlice({
  name: 'issuedCredentials',
  initialState,
  reducers: {
    addVerifiableCredential (state: IssuedCredentialsState, { payload: { subject, credential } }: PayloadAction<IssuedCredentialPayload>) {
      if (hasCredentialsBySubject(state, subject)) {
        state.credentials[subject].push(credential)
      } else {
        state.credentials[subject] = [credential]
      }
    }
  }
})

// actions
export const { addVerifiableCredential } = issuedCredentialsSlice.actions

// selectors
export const getCredentials = (state: IssuedCredentialsState) => state.credentials
export const getCredentialsBySubject = (state: IssuedCredentialsState, subject: string) => state.credentials[subject]
export const hasCredentialsBySubject = (state: IssuedCredentialsState, subject: string) => !!state.credentials[subject]
export const hasIssuedCredentials = (state: IssuedCredentialsState) => !!Object.keys(state.credentials).length

// dispatchers
type AddCredentialBySubject = (dispatch: Dispatch) => (subject: string, credential: IssuedCredentialState) => void

export const addCredentialBySubject: AddCredentialBySubject = (dispatch) => (subject, credential) => {
  dispatch(addVerifiableCredential({ subject, credential }))
}

// reducer
export default issuedCredentialsSlice.reducer
