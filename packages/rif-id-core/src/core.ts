import { Store } from 'redux'
import { configureStore } from '@reduxjs/toolkit'
import identityProviders, {
  addMnemonicProvider,
  addMnemonicProviderDefault,
  getDefaultProvider,
  IdentityProvidersState,
  IdentityProviderState
} from '@rsksmart/rif-id-core-reducer/lib/identityProviders'
import { generateMnemonic } from '@rsksmart/rif-id-mnemonic'
import { pipe } from 'lodash/fp'

type AddMnemonicProvider = (name: string, mnemonic: string) => void
type AddMnemonicProviderDefault = (mnemonic: string) => void

export interface RIFIdentityStateInterface {
  identityProviders: IdentityProvidersState;
}

export interface RIFIdentityFactory {
  fromMnemonic: (mnemonic: string) => RIFIdentityInterface
  createWithMnemonic: (sentenceLength?: number) => RIFIdentityInterface

}
export interface RIFIdentityInterface {
  store: Store<RIFIdentityStateInterface>,
  getDefaultProvider: () => IdentityProviderState
  addMnemonicProvider: AddMnemonicProvider
  addMnemonicProviderDefault: AddMnemonicProviderDefault
}

const RIFIdentity = function (this: RIFIdentityInterface) {
  this.store = configureStore({
    reducer: {
      identityProviders
    }
  })
} as any as ({ new (): RIFIdentityInterface;} & RIFIdentityFactory)

RIFIdentity.prototype.addMnemonicProviderDefault = function (mnemonic: string) {
  addMnemonicProviderDefault(this.store.dispatch)(mnemonic)
}

RIFIdentity.prototype.addMnemonicProvider = function (name: string, mnemonic: string) {
  addMnemonicProvider(this.store.dispatch)(name, mnemonic)
}

RIFIdentity.prototype.getDefaultProvider = function (): IdentityProviderState {
  return getDefaultProvider(this.store.getState().identityProviders)
}

RIFIdentity.fromMnemonic = function (mnemonic: string) {
  const identity = new RIFIdentity()

  identity.addMnemonicProviderDefault(mnemonic)

  return identity
}

RIFIdentity.createWithMnemonic = function (sentenceLength: number = 12) {
  return pipe(
    generateMnemonic,
    RIFIdentity.fromMnemonic
  )(sentenceLength)
}

export default RIFIdentity
