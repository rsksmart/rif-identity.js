import RIFIdentity from '../src/core'
import { hasProviders } from '@rsksmart/rif-id-core-reducer/src/identityProviders'

const mnemonic = 'egg quote away castle human cluster penalty blood word sweet fall swing'

describe('mnemonic management', () => {
  test('create empty identity', () => {
    const identity = new RIFIdentity()

    expect(hasProviders(identity.store.getState().identityProviders)).toBeFalsy()
  })

  test('create empty identity and add mnemonic', () => {
    const identity = new RIFIdentity()

    identity.addMnemonicProvider('default', mnemonic)

    const mnemonicProvider = identity.getDefaultProvider()

    expect(mnemonicProvider.type).toEqual('mnemonic')
    expect(mnemonicProvider.args!.mnemonic).toEqual(mnemonic)
  })

  test('create an identity from existing mnemonic', () => {
    const identity = RIFIdentity.fromMnemonic(mnemonic)

    const mnemonicProvider = identity.getDefaultProvider()

    expect(mnemonicProvider.type).toEqual('mnemonic')
    expect(mnemonicProvider.args!.mnemonic).toEqual(mnemonic)
  })

  test.each(
    [[12], [15], [18], [21], [24]]
  )('create an identity with a new mnemonic - size %i', (length) => {
    const identity = RIFIdentity.createWithMnemonic(length)

    const mnemonicProvider = identity.getDefaultProvider()

    expect(mnemonicProvider.type).toEqual('mnemonic')
    expect(mnemonicProvider.args!.mnemonic.split(' ').length).toEqual(length)
  })

  test('create an identity with a new mnemonic - default size', () => {
    const identity = RIFIdentity.createWithMnemonic()

    const mnemonicProvider = identity.getDefaultProvider()

    expect(mnemonicProvider.type).toEqual('mnemonic')
    expect(mnemonicProvider.args!.mnemonic.split(' ').length).toEqual(12)
  })
})
