import deepFreeze from 'deep-freeze'
import signatureProvider, {
  addProvider,
  changeProvider,
  removeProvider,
  setDefaultProvider,
  initialState,
  IdentityProvidersState,
  hasProviders,
  getProviderNames,
  getDefaultProvider,
  getProviderByName,
  hasProviderByName
} from '../src/identityProviders'

const mnemonic1 = 'arctic element road type cotton window uncover vicious goat puppy dune dragon'
const mnemonic2 = 'drip reopen mesh throw correct current smile gossip child display come stove rice camera globe'

const oneProviderState: IdentityProvidersState = deepFreeze({
  providers: {
    mnemonic1: {
      type: 'mnemonic',
      args: { mnemonic: mnemonic1 }
    }
  },
  defaultProvider: 'mnemonic1'
})

const twoProvidersState: IdentityProvidersState = deepFreeze({
  providers: {
    mnemonic1: {
      type: 'mnemonic',
      args: { mnemonic: mnemonic1 }
    },
    mnemonic2: {
      type: 'mnemonic',
      args: { mnemonic: mnemonic2 }
    }
  },
  defaultProvider: 'mnemonic1'
})

describe('signature provider', () => {
  describe('reducer', () => {
    test('add first provider', () => {
      const state = signatureProvider(initialState, {
        type: addProvider.type,
        payload: {
          name: 'mnemonic1',
          provider: {
            type: 'mnemonic',
            args: { mnemonic: mnemonic1 }
          }
        }
      })

      expect(state).toEqual(oneProviderState)
    })

    test('add second provider', () => {
      const state = signatureProvider(oneProviderState, {
        type: addProvider.type,
        payload: {
          name: 'mnemonic2',
          provider: {
            type: 'mnemonic',
            args: { mnemonic: mnemonic2 }
          }
        }
      })

      expect(state).toEqual(twoProvidersState)
    })

    test('add existent provider', () => {
      const state = signatureProvider(oneProviderState, {
        type: addProvider.type,
        payload: {
          name: 'mnemonic1',
          provider: {
            type: 'mnemonic',
            args: { mnemonic: 'belt diet dutch eternal include super grant hard donkey artwork brick floor' }
          }
        }
      })

      expect(state).toEqual(oneProviderState)
    })

    test('update provider', () => {
      const state = signatureProvider(oneProviderState, {
        type: changeProvider.type,
        payload: {
          name: 'mnemonic1',
          provider: {
            type: 'mnemonic',
            args: { mnemonic: 'belt diet dutch eternal include super grant hard donkey artwork brick floor' }
          }
        }
      })

      expect(state).toEqual({
        defaultProvider: 'mnemonic1',
        providers: {
          mnemonic1: {
            type: 'mnemonic',
            args: { mnemonic: 'belt diet dutch eternal include super grant hard donkey artwork brick floor' }
          }
        }
      })
    })

    test('update not existent provider', () => {
      const state = signatureProvider(oneProviderState, {
        type: changeProvider.type,
        payload: {
          name: 'mnemonic3',
          provider: {
            type: 'mnemonic',
            args: { mnemonic: 'belt diet dutch eternal include super grant hard donkey artwork brick floor' }
          }
        }
      })

      expect(state).toEqual(oneProviderState)
    })

    test('remove not default provider', () => {
      const state = signatureProvider(twoProvidersState, {
        type: removeProvider.type,
        payload: {
          name: 'mnemonic2'
        }
      })

      expect(state).toEqual(oneProviderState)
    })

    test('remove default provider', () => {
      const state = signatureProvider(twoProvidersState, {
        type: removeProvider.type,
        payload: {
          name: 'mnemonic1'
        }
      })

      expect(state).toEqual({
        providers: {
          mnemonic2: {
            type: 'mnemonic',
            args: { mnemonic: mnemonic2 }
          }
        },
        defaultProvider: 'mnemonic2'
      })
    })

    test('remove last provider', () => {
      const state = signatureProvider(oneProviderState, {
        type: removeProvider.type,
        payload: {
          name: 'mnemonic1'
        }
      })

      expect(state).toEqual(initialState)
    })

    test('set default provider to existent', () => {
      const state = signatureProvider(twoProvidersState, {
        type: setDefaultProvider.type,
        payload: {
          name: 'mnemonic2'
        }
      })

      expect(state).toEqual({
        providers: {
          mnemonic1: {
            type: 'mnemonic',
            args: { mnemonic: mnemonic1 }
          },
          mnemonic2: {
            type: 'mnemonic',
            args: { mnemonic: mnemonic2 }
          }
        },
        defaultProvider: 'mnemonic2'
      })
    })

    test('set default provider to not existent', () => {
      const state = signatureProvider(twoProvidersState, {
        type: setDefaultProvider.type,
        payload: {
          name: 'mnemonic3'
        }
      })

      expect(state).toEqual({
        providers: {
          mnemonic1: {
            type: 'mnemonic',
            args: { mnemonic: mnemonic1 }
          },
          mnemonic2: {
            type: 'mnemonic',
            args: { mnemonic: mnemonic2 }
          }
        },
        defaultProvider: 'mnemonic1'
      })
    })
  })

  describe('action creators', () => {
    test('change provider', () => {
      const action = addProvider({
        name: 'mnemonic1',
        provider: {
          type: 'mnemonic',
          args: {
            mnemonic: mnemonic1
          }
        }
      })

      expect(action).toEqual({
        type: addProvider.type,
        payload: {
          name: 'mnemonic1',
          provider: {
            type: 'mnemonic',
            args: {
              mnemonic: mnemonic1
            }
          }
        }
      })
    })

    test('change provider', () => {
      const action = changeProvider({
        name: 'mnemonic1',
        provider: {
          type: 'mnemonic',
          args: {
            mnemonic: mnemonic1
          }
        }
      })

      expect(action).toEqual({
        type: changeProvider.type,
        payload: {
          name: 'mnemonic1',
          provider: {
            type: 'mnemonic',
            args: {
              mnemonic: mnemonic1
            }
          }
        }
      })
    })

    test('remove provider', () => {
      const action = removeProvider({
        name: 'mnemonic1'
      })

      expect(action).toEqual({
        type: removeProvider.type,
        payload: {
          name: 'mnemonic1'
        }
      })
    })

    test('set default provider', () => {
      const action = setDefaultProvider({
        name: 'mnemonic1'
      })

      expect(action).toEqual({
        type: setDefaultProvider.type,
        payload: {
          name: 'mnemonic1'
        }
      })
    })
  })

  describe('selectors', () => {
    it('has provider', () => {
      expect(hasProviders(initialState)).toBe(false)

      expect(hasProviders(oneProviderState)).toBe(true)

      expect(hasProviders(twoProvidersState)).toBe(true)
    })

    it('get names', () => {
      expect(getProviderNames(initialState)).toEqual([])

      expect(getProviderNames(oneProviderState)).toEqual(['mnemonic1'])

      expect(getProviderNames(twoProvidersState)).toEqual(['mnemonic1', 'mnemonic2'])
    })

    it('has by name', () => {
      expect(hasProviderByName(initialState, 'mnemonic1')).toBeFalsy()

      expect(hasProviderByName(oneProviderState, 'mnemonic1')).toBeTruthy()
      expect(hasProviderByName(oneProviderState, 'mnemonic2')).toBeFalsy()

      expect(hasProviderByName(twoProvidersState, 'mnemonic1')).toBeTruthy()
      expect(hasProviderByName(twoProvidersState, 'mnemonic2')).toBeTruthy()
      expect(hasProviderByName(twoProvidersState, 'mnemonic3')).toBeFalsy()
    })

    it('get default provider', () => {
      expect(getDefaultProvider(initialState)).toBeUndefined()

      expect(getDefaultProvider(oneProviderState)).toEqual({
        type: 'mnemonic',
        args: {
          mnemonic: mnemonic1
        }
      })

      expect(getDefaultProvider(twoProvidersState)).toEqual({
        type: 'mnemonic',
        args: {
          mnemonic: mnemonic1
        }
      })
    })

    it('get provider by name', () => {
      expect(getProviderByName(initialState, 'mnemonic1')).toBeUndefined()

      expect(getProviderByName(oneProviderState, 'mnemonic1')).toEqual({
        type: 'mnemonic',
        args: {
          mnemonic: mnemonic1
        }
      })
      expect(getProviderByName(oneProviderState, 'mnemonic2')).toBeUndefined()

      expect(getProviderByName(twoProvidersState, 'mnemonic1')).toEqual({
        type: 'mnemonic',
        args: {
          mnemonic: mnemonic1
        }
      })
      expect(getProviderByName(twoProvidersState, 'mnemonic2')).toEqual({
        type: 'mnemonic',
        args: {
          mnemonic: mnemonic2
        }
      })
      expect(getProviderByName(twoProvidersState, 'mnemonic3')).toBeUndefined()
    })
  })
})
