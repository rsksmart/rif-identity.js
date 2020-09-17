import { configureStore, Store, AnyAction } from '@reduxjs/toolkit'
import credentialsReducer, {
  addCredential,
  removeCredential,
  selectCredentials,
  Credential,
  CredentialsState, selectCredentialByHash
} from '../../src/reducers/credentials'
import { did, did2, did3 } from '../util'

const credential1: Credential = {
  issuer: did3,
  subject: did,
  issuanceDate: +new Date(),
  expirationDate: +new Date(+new Date() + 10000),
  context: ['https://www.w3.org/2018/credentials/v1323', 'https://www.w3.org/2020/demo/1234'],
  type: ['VerifiableCredential', 'PublicProfile'],
  raw: 'mockJWT1',
  hash: 'mockHash1',
  credentialSubject: {
    name: 'Alice',
    age: 35
  }
}

const credential2: Credential = {
  issuer: did3,
  subject: did2,
  issuanceDate: +new Date(),
  expirationDate: +new Date(+new Date() + 10000),
  context: ['https://www.w3.org/2018/credentials/v1323', 'https://www.w3.org/2020/demo/1234'],
  type: ['VerifiableCredential', 'PublicProfile'],
  raw: 'mockJWT2',
  hash: 'mockHash2',
  credentialSubject: {
    name: 'Bob',
    age: 32
  }
}

const credential3: Credential = {
  issuer: did2,
  subject: did,
  issuanceDate: +new Date(),
  context: ['https://www.w3.org/2018/credentials/v1323', 'https://www.w3.org/2020/demo/1234'],
  type: ['VerifiableCredential', 'PublicProfile'],
  raw: 'mockJWT3',
  hash: 'mockHash3',
  credentialSubject: {
    name: 'Alice',
    city: 'London'
  }
}

describe('credentials reducer', () => {
  describe('action creators', () => {
    test('add credential', () => {
      expect(addCredential({ credential: credential1 })).toEqual({
        payload: { credential: credential1 },
        type: addCredential.type
      })
    })

    test('remove credential', () => {
      const payload = { subject: credential1.subject, hash: credential1.hash }
      expect(removeCredential(payload)).toEqual({ payload, type: removeCredential.type })
    })
  })

  describe('selectors', () => {
    test('select credentials of initial state', () => {
      const initialState: CredentialsState = {}

      expect(selectCredentials(initialState, credential1.subject)).toBeUndefined()
    })

    test('select credentials', () => {
      const state: CredentialsState = {}
      state[credential1.subject] = [credential1]
      expect(selectCredentials(state, credential1.subject)).toEqual([credential1])
    })

    test('select credential by hash of initial state', () => {
      const state: CredentialsState = {}

      expect(selectCredentialByHash(state, credential1.subject, credential1.hash)).toBeUndefined()
    })

    test('select credential by hash when non existent hash', () => {
      const state: CredentialsState = {}
      state[credential1.subject] = [credential1]

      expect(selectCredentialByHash(state, credential1.subject, credential2.hash)).toBeUndefined()
    })

    test('select credential by hash when non existent hash nor subject', () => {
      const state: CredentialsState = {}
      state[credential1.subject] = [credential1]

      expect(selectCredentialByHash(state, credential2.subject, credential2.hash)).toBeUndefined()
    })

    test('select credential by hash when only one subject and one hash', () => {
      const state: CredentialsState = {}
      state[credential1.subject] = [credential1]

      expect(selectCredentialByHash(state, credential1.subject, credential1.hash)).toEqual(credential1)
    })

    test('select credential by hash when more than one subject and hash', () => {
      const state: CredentialsState = {}
      state[credential1.subject] = [credential1, credential3]
      state[credential2.subject] = [credential2]

      expect(selectCredentialByHash(state, credential1.subject, credential1.hash)).toEqual(credential1)
      expect(selectCredentialByHash(state, credential2.subject, credential2.hash)).toEqual(credential2)
      expect(selectCredentialByHash(state, credential3.subject, credential3.hash)).toEqual(credential3)
    })
  })

  describe('reducer', () => {
    let store: Store<CredentialsState, AnyAction>
    let expectedState: CredentialsState

    beforeEach(() => {
      store = configureStore({ reducer: credentialsReducer })
    })

    afterEach(() => {
      expect(store.getState()).toEqual(expectedState)
    })

    test('initially has no credentials', () => {
      expectedState = {}
    })

    test('add credential in one identity', () => {
      store.dispatch(addCredential({ credential: credential1 }))

      expectedState = {}
      expectedState[did] = [credential1]
    })

    test('add credential in different identities', () => {
      store.dispatch(addCredential({ credential: credential1 }))
      store.dispatch(addCredential({ credential: credential2 }))

      expectedState = {}
      expectedState[did] = [credential1]
      expectedState[did2] = [credential2]
    })

    test('add two credentials in same identity', () => {
      store.dispatch(addCredential({ credential: credential1 }))
      store.dispatch(addCredential({ credential: credential3 }))

      expectedState = {}
      expectedState[did] = [credential1, credential3]
    })

    test('removes credential from one credential', () => {
      store.dispatch(addCredential({ credential: credential1 }))
      store.dispatch(removeCredential({ subject: did, hash: credential1.hash }))

      expectedState = {}
    })

    test('removes credential from many credentials', () => {
      store.dispatch(addCredential({ credential: credential1 }))
      store.dispatch(addCredential({ credential: credential3 }))
      store.dispatch(removeCredential({ subject: did, hash: credential1.hash }))

      expectedState = {}
      expectedState[did] = [credential3]
    })

    test('integration', () => {
      store.dispatch(addCredential({ credential: credential1 }))
      store.dispatch(addCredential({ credential: credential2 }))
      store.dispatch(addCredential({ credential: credential3 }))

      store.dispatch(removeCredential({ subject: did, hash: credential1.hash }))

      expectedState = {}
      expectedState[did] = [credential3]
      expectedState[did2] = [credential2]
    })
  })
})
