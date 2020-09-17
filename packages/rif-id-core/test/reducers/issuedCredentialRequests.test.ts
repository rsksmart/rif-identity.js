import { configureStore } from '@reduxjs/toolkit'
import issuedCredentialRequestsReducer, {
  addIssuedCredentialRequest,
  setIssuedCredentialRequestStatus,
  deleteIssuedCredentialRequest,
  selectIssuedCredentialRequests,
  IssuedCredentialRequest,
  IssuedCredentialRequestStatus,
  IssuedCredentialRequestsState
} from '../../src/reducers/issuedCredentialRequests'
import { did, did3 } from '../util'

const addIssuedCredentialRequestPayload = {
  from: did,
  messageId: '10',
  to: did3,
  claims: [
    { claimType: 'fullName', claimValue: 'Steve Wozniak' },
    { claimType: 'age', claimValue: '70' }
  ]
}

const getSetIssuedCredentialRequestStatusPayload = (status: IssuedCredentialRequestStatus) => ({
  from: did,
  messageId: '10',
  status
})

const deleteIssuedCredentialRequestPayload = {
  from: did,
  messageId: '10'
}

const issuedCredentialRequest: IssuedCredentialRequest = {
  from: did,
  messageId: '10',
  to: did3,
  claims: [
    { claimType: 'fullName', claimValue: 'Steve Wozniak' },
    { claimType: 'age', claimValue: '70' }
  ],
  status: 'pending'
}

describe('issued credential requests reducer', () => {
  describe('action creators', () => {
    test('add issued credential request', () => {
      expect(addIssuedCredentialRequest(addIssuedCredentialRequestPayload)).toEqual({
        payload: addIssuedCredentialRequestPayload,
        type: addIssuedCredentialRequest.type
      })
    })

    test.each([['pending', 'pending', 'received', 'denied', 'invalid', 'error']])('set issued credential request status - %s', (status: IssuedCredentialRequestStatus) => {
      expect(setIssuedCredentialRequestStatus(getSetIssuedCredentialRequestStatusPayload(status))).toEqual({
        payload: getSetIssuedCredentialRequestStatusPayload(status),
        type: setIssuedCredentialRequestStatus.type
      })
    })

    test('delete issued credential request', () => {
      expect(deleteIssuedCredentialRequest(deleteIssuedCredentialRequestPayload)).toEqual({
        payload: deleteIssuedCredentialRequestPayload,
        type: deleteIssuedCredentialRequest.type
      })
    })
  })

  describe('selectors', () => {
    test('from initial reducer', () => {
      expect(selectIssuedCredentialRequests({}, did)).toBeUndefined()
    })

    test('from identity reducer', () => {
      const state: IssuedCredentialRequestsState = {}
      state[did] = [issuedCredentialRequest]
      expect(selectIssuedCredentialRequests(state, did)).toEqual([issuedCredentialRequest])
    })
  })

  test('reducer', () => {
    let expectedState: IssuedCredentialRequestsState = {}
    const store = configureStore({ reducer: issuedCredentialRequestsReducer })
    expect(store.getState()).toEqual(expectedState)

    expectedState[did] = [issuedCredentialRequest]
    store.dispatch(addIssuedCredentialRequest(addIssuedCredentialRequestPayload))
    expect(store.getState()).toEqual(expectedState)

    expectedState[did] = [Object.assign({}, issuedCredentialRequest, { status: 'received' })]
    store.dispatch(setIssuedCredentialRequestStatus(getSetIssuedCredentialRequestStatusPayload('received')))
    expect(store.getState()).toEqual(expectedState)

    expectedState = {}
    store.dispatch(deleteIssuedCredentialRequest(deleteIssuedCredentialRequestPayload))
    expect(store.getState()).toEqual(expectedState)
  })
})
