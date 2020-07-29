import identityReducer, { name, setIdentity, hasIdentity, getIdentity, initialState } from '../src/identityReducer'

const did = 'did:ethr:rsk:0x44A63f8C12Db7Abb1959B32bB9fa7ee29A130BCD'

describe(name, () => {
  describe('action creators', () => {
    test('create identity', () => {
      expect(setIdentity({ did })).toEqual({
        payload: { did },
        type: setIdentity.type
      })
    })
  })

  describe('selectors', () => {
    test('has identity', () => {
      expect(hasIdentity({ did: '' })).toBeFalsy()
      expect(hasIdentity({ did })).toBeTruthy()
    })

    test('get identity', () => {
      expect(hasIdentity({ did: '' })).toBeFalsy()
      expect(getIdentity({ did })).toEqual(did)
    })
  })

  describe('reducer', () => {
    test('identity', () => {
      let state = initialState

      state = identityReducer(state, setIdentity({ did }))

      expect(hasIdentity(state)).toBeTruthy()
      expect(getIdentity(state)).toEqual(did)

      expect(() => identityReducer(state, setIdentity({ did: 'did:ethr:rsk:0x22271517343929682c72F7F3e081E25577364687' }))).toThrow()
    })
  })
})
