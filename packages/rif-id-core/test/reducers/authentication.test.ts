import { AnyAction, configureStore, Store } from '@reduxjs/toolkit'
import { did, did2, did3, did4 } from '../util'
import authenticationReducer, { addServiceToken, AuthenticationState, removeServiceToken, selectServiceTokenByIdentity } from '../../src/reducers/authentication'

describe('authentication reducer', () => {
  const token = 'theToken'
  const anotherToken = 'another'

  describe('reducer', () => {
    let store: Store<AuthenticationState, AnyAction>
    let expectedState: AuthenticationState

    beforeEach(() => {
      store = configureStore({ reducer: authenticationReducer })
    })

    afterEach(() => {
      expect(store.getState()).toEqual(expectedState)
    })

    test('no tokens', () => {
      expectedState = {}
    })

    test('adds token for one identity with one service', () => {
      store.dispatch(addServiceToken({ identity: did, serviceDid: did2, token }))

      expectedState = {}
      expectedState[did] = {}
      expectedState[did][did2] = token
    })

    test('adds token for one identity with two services', () => {
      store.dispatch(addServiceToken({ identity: did, serviceDid: did2, token }))
      store.dispatch(addServiceToken({ identity: did, serviceDid: did3, token: anotherToken }))

      expectedState = {}
      expectedState[did] = {}
      expectedState[did][did2] = token
      expectedState[did][did3] = anotherToken
    })

    test('adds token for two identities with one service each', async () => {
      store.dispatch(addServiceToken({ identity: did, serviceDid: did2, token }))
      store.dispatch(addServiceToken({ identity: did3, serviceDid: did4, token: anotherToken }))

      expectedState = {}
      expectedState[did] = {}
      expectedState[did][did2] = token
      expectedState[did3] = {}
      expectedState[did3][did4] = anotherToken
    })

    test('adds tokens for two identities with two services each', async () => {
      store.dispatch(addServiceToken({ identity: did, serviceDid: did2, token }))
      store.dispatch(addServiceToken({ identity: did, serviceDid: did4, token: anotherToken }))
      store.dispatch(addServiceToken({ identity: did3, serviceDid: did2, token }))
      store.dispatch(addServiceToken({ identity: did3, serviceDid: did4, token: anotherToken }))

      expectedState = {}
      expectedState[did] = {}
      expectedState[did][did2] = token
      expectedState[did][did4] = anotherToken
      expectedState[did3] = {}
      expectedState[did3][did2] = token
      expectedState[did3][did4] = anotherToken
    })

    test('removes the unique token from one identity with one service', () => {
      store.dispatch(addServiceToken({ identity: did, serviceDid: did2, token }))
      store.dispatch(removeServiceToken({ identity: did, serviceDid: did2 }))

      expectedState = {}
      expectedState[did] = {}
    })

    test('removes just one token from one identity with two services', () => {
      store.dispatch(addServiceToken({ identity: did, serviceDid: did2, token }))
      store.dispatch(addServiceToken({ identity: did, serviceDid: did3, token: anotherToken }))
      store.dispatch(removeServiceToken({ identity: did, serviceDid: did2 }))

      expectedState = {}
      expectedState[did] = {}
      expectedState[did][did3] = anotherToken
    })

    test('removes one token from two identities with one token each', () => {
      store.dispatch(addServiceToken({ identity: did, serviceDid: did2, token }))
      store.dispatch(addServiceToken({ identity: did3, serviceDid: did4, token: anotherToken }))
      store.dispatch(removeServiceToken({ identity: did3, serviceDid: did4 }))

      expectedState = {}
      expectedState[did] = {}
      expectedState[did3] = {}
      expectedState[did][did2] = token
    })

    test('removes one token for each identities when two identities with two tokens each', () => {
      store.dispatch(addServiceToken({ identity: did, serviceDid: did2, token }))
      store.dispatch(addServiceToken({ identity: did, serviceDid: did4, token: anotherToken }))
      store.dispatch(addServiceToken({ identity: did3, serviceDid: did2, token }))
      store.dispatch(addServiceToken({ identity: did3, serviceDid: did4, token: anotherToken }))
      store.dispatch(removeServiceToken({ identity: did, serviceDid: did2 }))
      store.dispatch(removeServiceToken({ identity: did3, serviceDid: did4 }))

      expectedState = {}
      expectedState[did] = {}
      expectedState[did][did4] = anotherToken
      expectedState[did3] = {}
      expectedState[did3][did2] = token
    })
  })

  describe('action creators', () => {
    test('add service token', () => {
      const payload = { identity: did, serviceDid: did2, token }
      expect(addServiceToken(payload)).toEqual({ payload, type: addServiceToken.type })
    })

    test('remove service token', () => {
      const payload = { identity: did, serviceDid: did2 }
      expect(removeServiceToken(payload)).toEqual({ payload, type: removeServiceToken.type })
    })
  })

  describe('selectors', () => {
    test('initial state', () => {
      const initialState: AuthenticationState = {}

      expect(selectServiceTokenByIdentity(initialState, did, did2)).toBeUndefined()
    })

    test('select existing value one service one token state', () => {
      const state: AuthenticationState = {}
      state[did] = {}
      state[did][did2] = token

      expect(selectServiceTokenByIdentity(state, did, did2)).toEqual(token)
    })

    test('select non existing value one service one token state', () => {
      const state: AuthenticationState = {}
      state[did] = {}
      state[did][did2] = token

      expect(selectServiceTokenByIdentity(state, did3, did4)).toBeUndefined()
    })

    test('select existing values two services two tokens each state', () => {
      const state: AuthenticationState = {}
      state[did] = {}
      state[did4] = {}
      state[did][did2] = token
      state[did][did3] = anotherToken
      state[did4][did2] = anotherToken
      state[did4][did3] = token

      expect(selectServiceTokenByIdentity(state, did, did2)).toEqual(token)
      expect(selectServiceTokenByIdentity(state, did4, did3)).toEqual(token)
      expect(selectServiceTokenByIdentity(state, did4, did2)).toEqual(anotherToken)
      expect(selectServiceTokenByIdentity(state, did, did3)).toEqual(anotherToken)
    })

    test('select non existing values two services two tokens each state', () => {
      const state: AuthenticationState = {}
      state[did] = {}
      state[did4] = {}
      state[did][did2] = token
      state[did][did3] = anotherToken
      state[did4][did2] = anotherToken
      state[did4][did3] = token

      expect(selectServiceTokenByIdentity(state, did3, did4)).toBeUndefined()
      expect(selectServiceTokenByIdentity(state, did2, did4)).toBeUndefined()
      expect(selectServiceTokenByIdentity(state, did, did4)).toBeUndefined()
      expect(selectServiceTokenByIdentity(state, did4, did)).toBeUndefined()
    })
  })
})
