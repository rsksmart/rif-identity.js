import deepFreeze from 'deep-freeze'
import { createStore } from '@reduxjs/toolkit'
import issuedCredentialsSlice, {
  IssuedCredentialsState, initialState, addVerifiableCredential, getCredentialsBySubject, hasCredentialsBySubject, hasIssuedCredentials, addCredentialBySubject, getCredentials
} from '../src/issuedCredentials'

const subject1 = 'did:ethr:0x52aE2e11082f65B00a88095F8e160b8432532522'
const subject2 = 'did:ethr:0x16e3Df3c58E42dd92411E0b961e8d3e0C0238e5C'

const jwt1 = 'the.first.jwt'
const jwt2 = 'the.second.jwt'

const state: IssuedCredentialsState = {
  credentials: {
    'did:ethr:0x52aE2e11082f65B00a88095F8e160b8432532522': [{
      jwt: jwt1
    }]
  }
}
// NOTE: the hardcoded key is temporary, is the subject1 value

const oneSubjectState = deepFreeze(state) as unknown as IssuedCredentialsState

describe('issued credentials', () => {
  describe('reducer', () => {
    test('add first credential for first subject', () => {
      const state = issuedCredentialsSlice(initialState, {
        type: addVerifiableCredential.type,
        payload: {
          subject: subject1,
          credential: {
            jwt: jwt1
          }
        }
      })

      expect(state).toEqual(oneSubjectState)
    })

    it('add another credential to a subject with existing credentials', () => {
      const state = issuedCredentialsSlice(oneSubjectState, {
        type: addVerifiableCredential.type,
        payload: {
          subject: subject1,
          credential: {
            jwt: jwt2
          }
        }
      })

      expect(Object.keys(state.credentials)).toEqual([subject1])
      expect(state.credentials[subject1].length).toEqual(2)
      expect(state.credentials[subject1][1].jwt).toEqual(jwt2)
    })

    it('add credential for a subject without credentials when there is already a subject', () => {
      const state = issuedCredentialsSlice(oneSubjectState, {
        type: addVerifiableCredential.type,
        payload: {
          subject: subject2,
          credential: {
            jwt: jwt2
          }
        }
      })

      expect(Object.keys(state.credentials)).toEqual([subject1, subject2])
      expect(state.credentials[subject2][0].jwt).toEqual(jwt2)
    })
  })

  describe('action creators', () => {
    test('add a new credential', () => {
      const action = addVerifiableCredential({
        subject: subject1,
        credential: {
          jwt: jwt1
        }
      })

      expect(action).toEqual({
        type: addVerifiableCredential.type,
        payload: {
          subject: subject1,
          credential: {
            jwt: jwt1
          }
        }
      })
    })
  })

  describe('selectors', () => {
    test('get credentials by subject', () => {
      expect(getCredentialsBySubject(initialState, subject1)).toBeFalsy()

      expect(getCredentialsBySubject(oneSubjectState, subject1)).toBeTruthy()
      expect(getCredentialsBySubject(oneSubjectState, subject1).length).toBe(1)

      expect(getCredentialsBySubject(oneSubjectState, subject2)).toBeFalsy()
    })

    test('has credentials by subject', () => {
      expect(hasCredentialsBySubject(initialState, subject1)).toBeFalsy()

      expect(hasCredentialsBySubject(oneSubjectState, subject1)).toBeTruthy()

      expect(hasCredentialsBySubject(oneSubjectState, subject2)).toBeFalsy()
    })

    test('has issued credentials', () => {
      expect(hasIssuedCredentials(initialState)).toBeFalsy()

      expect(hasIssuedCredentials(oneSubjectState)).toBeTruthy()
    })

    test('get all credentials', () => {
      expect(getCredentials(initialState)).toEqual({})

      expect(getCredentials(oneSubjectState)).toEqual(oneSubjectState.credentials)
    })
  })

  describe('dispatchers', () => {
    test('add credential by subject', () => {
      const store = createStore(issuedCredentialsSlice)

      addCredentialBySubject(store.dispatch)(subject1, { jwt: jwt1 })

      const state = store.getState()

      expect(state).toEqual(oneSubjectState)
    })
  })
})
