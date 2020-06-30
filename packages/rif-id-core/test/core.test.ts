import RIFIdentity from '../src/core'
import { RIFIdentityInterface } from '../src/core'
import { hasProviders } from '@rsksmart/rif-id-core-reducer/lib/identityProviders'


const mnemonic = 'egg quote away castle human cluster penalty blood word sweet fall swing'

describe('mnemonic management', () => {
  test('create empty identity', () => {
    const identity = new RIFIdentity()

    expect(hasProviders(identity.store.identityProvider)).toBeFalsy()
  })

  test('create empty identity and add mnemonic', () => {
    const identity: RIFIdentityInterface = new RIFIdentity()

    identity.addMnemonicProvider('default', mnemonic)

    const mnemonicProvider = identity.getDefaultProvider()

    console.log(mnemonicProvider)

    expect(mnemonicProvider.type).toEqual('mnemonic')
    expect(mnemonicProvider.args.mnemonic).toEqual(mnemonic)
  })

  test('cannot crete if created', () => {
    const identity: RIFIdentityInterface = new RIFIdentity()

    identity.addMnemonicProvider('default', mnemonic)

    expect(identity.createWithMnemonic()).toThrowError('Already created')
  })

  test('create an identity with a new mnemonic', () => {
    const identity = RIFIdentity.createWithMnemonic()

    const mnemonicProvider = identity.getDefaultProvider()

    expect(mnemonicProvider.type).toEqual('mnemonic')
    expect(mnemonicProvider.args.mnemonic.split(' ').length).toEqual(12)
  })
})
