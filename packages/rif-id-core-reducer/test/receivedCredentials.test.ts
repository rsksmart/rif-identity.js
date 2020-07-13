import deepFreeze from 'deep-freeze'
import { createStore } from '@reduxjs/toolkit'
import receivedCredentialsSlice, { Credential, ReceivedCredentialsState, initialState, addCredential, getCredentialById, hasCredentialsByDID, getCredentialsByDID, hasCredentials, getAllCredentials, addReceivedCredential } from '../src/receivedCredentials'

const subject = 'did:ethr:0x52aE2e11082f65B00a88095F8e160b8432532522'
const issuer = 'did:ethr:0x16e3Df3c58E42dd92411E0b961e8d3e0C0238e5C'

const cred1: Credential = {
  id: 'id1',
  subject,
  issuer,
  claims: {
    name: 'Alice'
  },
  issuanceDate: new Date(),
  context: ['https://www.w3.org/2018/credentials/v1'],
  type: ['VerifiableCredential'],
  hash: 'test'
}

const cred2 = {
  id: 'id2',
  subject,
  issuer,
  claims: {
    name: 'Bob'
  },
  issuanceDate: new Date(),
  context: ['https://www.w3.org/2018/credentials/v1'],
  type: ['VerifiableCredential'],
  hash: 'anotherTest'
}

const state: ReceivedCredentialsState = {
  credentials: [cred1]
}

const oneCredentialState = deepFreeze(state) as ReceivedCredentialsState

describe('received credentials', () => {
  describe('reducer', () => {
    test('add first credential', () => {
      const state = receivedCredentialsSlice(initialState, {
        type: addCredential.type,
        payload: {
          credential: cred1
        }
      })

      expect(state).toEqual(oneCredentialState)
    })

    it('add another credential', () => {
      const state = receivedCredentialsSlice(oneCredentialState, {
        type: addCredential.type,
        payload: {
          credential: cred2
        }
      })

      expect(state.credentials.length).toEqual(2)
      expect(state.credentials[1]).toEqual(cred2)
    })
  })

  describe('action creators', () => {
    test('add a new credential', () => {
      const action = addCredential({
        credential: cred1
      })

      expect(action).toEqual({
        type: addCredential.type,
        payload: {
          credential: cred1
        }
      })
    })
  })

  describe('selectors', () => {
    test('get credentials by id', () => {
      expect(getCredentialById(initialState, 'noExists')).toBeFalsy()

      expect(getCredentialById(oneCredentialState, cred1.id!)).toEqual(cred1)
      expect(getCredentialById(oneCredentialState, cred2.id!)).toBeFalsy()
    })

    test('has credentials by did', () => {
      expect(hasCredentialsByDID(initialState, subject)).toBeFalsy()

      expect(hasCredentialsByDID(oneCredentialState, subject)).toBeTruthy()

      expect(hasCredentialsByDID(oneCredentialState, issuer)).toBeFalsy()
    })

    test('get credentials by did', () => {
      expect(getCredentialsByDID(initialState, subject).length).toEqual(0)

      expect(getCredentialsByDID(oneCredentialState, subject)).toEqual([cred1])

      expect(getCredentialsByDID(oneCredentialState, issuer).length).toEqual(0)
    })

    test('has credentials', () => {
      expect(hasCredentials(initialState)).toBeFalsy()

      expect(hasCredentials(oneCredentialState)).toBeTruthy()
    })

    test('get all credentials', () => {
      expect(getAllCredentials(initialState)).toEqual([])

      expect(getAllCredentials(oneCredentialState)).toEqual(oneCredentialState.credentials)
    })
  })

  describe('dispatchers', () => {
    test('add credential by subject', () => {
      const store = createStore(receivedCredentialsSlice)

      addReceivedCredential(store.dispatch)(cred1)

      const state = store.getState()

      expect(state).toEqual(oneCredentialState)
    })
  })
})
