import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Credential {
  credentialSubject: any
  issuer: string
  subject?: string // Subject can be null https://w3c.github.io/vc-data-model/#credential-uniquely-identifies-a-subject
  issuanceDate: number
  expirationDate?: number
  context: string[]
  type: string[]
  raw: string
  hash: string // blake2b(raw)
}

export interface CredentialsState {
  [did: string]: Credential[]
}

const initialState: CredentialsState = {}

interface AddCredentialPayload {
  credential: Credential
}

interface RemoveCredentialPayload {
  subject: string
  hash: string
}

const credentialsSlice = createSlice({
  name: 'credentials',
  initialState,
  reducers: {
    addCredential(state: CredentialsState, { payload: { credential }}: PayloadAction<AddCredentialPayload>) {
      if (!state[credential.subject]) state[credential.subject] = []
      state[credential.subject].push(credential)
    },
    removeCredential(state: CredentialsState, { payload: { subject, hash }}: PayloadAction<RemoveCredentialPayload>) {
      state[subject] = state[subject].filter(credential => credential.hash !== hash)
      if (state[subject].length === 0) delete state[subject]
    }
  }
})

export const { addCredential, removeCredential } = credentialsSlice.actions

export const selectCredentials = (state: CredentialsState, subject: string) => state[subject]
export const selectCredentialByHash = (state: CredentialsState, subject: string, hash: string) => state[subject]?.find(cred => cred.hash === hash)

export default credentialsSlice.reducer
