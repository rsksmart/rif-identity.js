import { configureStore, Store, AnyAction } from '@reduxjs/toolkit'
import identitySlice, { addIdentity, selectIdentities, IdentityState } from '../../src/reducers/identitySlice'

const did = 'did:ethr:rsk:0xf3beac30c498d9e26865f34fcaa57dbb935b0d74'
const did2 = 'did:ethr:rsk:0xdcbe93e98e0dcebe677c39a84f5f212b85ba7ef0'

describe('identity slice', () => {
  describe('action creators', () => {
    test('add identity', () => {
      expect(addIdentity({ did })).toEqual({ type: addIdentity.type, payload: { did } })
    })
  })

  describe('selectors', () => {
    test('no identity', () => {
      const state: IdentityState = {
        identities: []
      }

      expect(selectIdentities(state)).toEqual([])
    })

    test('one identity', () => {
      const state: IdentityState = {
        identities: [did]
      }

      expect(selectIdentities(state)).toEqual([did])
    })

    test('two identities', () => {
      const state: IdentityState = {
        identities: [did, did2]
      }

      expect(selectIdentities(state)).toEqual([did, did2])
    })
  })

  describe('reducer', () => {
    let store: Store<IdentityState, AnyAction>

    beforeEach(() => {
      store = configureStore({ reducer: identitySlice })
    })

    test('initial state', () => {
      const identities = selectIdentities(store.getState())

      expect(identities).toEqual([])
    })

    test('add identity', () => {
      store.dispatch(addIdentity({ did }))

      const identities = selectIdentities(store.getState())

      expect(identities).toEqual([did])
    })

    test('add two identities', () => {
      store.dispatch(addIdentity({ did }))
      store.dispatch(addIdentity({ did: did2 }))

      const identities = selectIdentities(store.getState())

      expect(identities).toEqual([did, did2])
    })
  })
})
