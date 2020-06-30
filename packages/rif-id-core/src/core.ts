import { createStore } from 'redux'
import coreReducer from '@rsksmart/rif-id-core-reducer'
import {
  addMnemonicProvider,
  getDefaultProvider,
  IdentityProvidersState,
  IdentityProviderState
} from '@rsksmart/rif-id-core-reducer/lib/identityProviders'

type AddMnemonicProvider = (name: string, mnemonic: string) => void
type AddMnemonicProviderDefault = (mnemonic: string) => void

export interface RIFIdentityInterface {
  store: {
    identityProvider: IdentityProvidersState
  },
  getDefaultProvider: () => IdentityProviderState
  addMnemonicProvider: AddMnemonicProvider
  addMnemonicProviderDefault: AddMnemonicProviderDefault
}

const RIFIdentity = function (this: RIFIdentityInterface): void {
  this.store = createStore(coreReducer)
} as any as { new (): RIFIdentityInterface; };

RIFIdentity.prototype.addMnemonicProvider = function (name: string, mnemonic: string) {
  addMnemonicProvider(this.store.dispatch)(name, mnemonic)
}

RIFIdentity.prototype.getDefaultIdentity = function (): IdentityProviderState {
  return getDefaultProvider(this.store.getState().identityProviders)
}

export default RIFIdentity
