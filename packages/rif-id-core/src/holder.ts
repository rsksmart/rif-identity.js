import {
  Credential, ReceivedCredentialsState, getAllCredentials, addReceivedCredential
} from '@rsksmart/rif-id-core-reducer/lib/receivedCredentials'
import { holderReducer } from '@rsksmart/rif-id-core-reducer'
import { Store, createStore } from 'redux'
import { RIFIdentityStateInterface, RIFIdentityInterface } from './core'

export interface RIFHolderStateInterface extends RIFIdentityStateInterface {
  receivedCredentials: ReceivedCredentialsState
}

export interface RIFIdHolderInterface {
  store: Store<RIFHolderStateInterface>
  addReceivedCredential: (data: Credential) => void
  getReceivedCredentials: () => Credential[]
}

const RIFIdHolder = function (this: RIFIdHolderInterface, identity: RIFIdentityInterface) {
  this.store = createStore(holderReducer, identity.store.getState())
} as any as ({ new (identity: RIFIdentityInterface): RIFIdHolderInterface;})

RIFIdHolder.prototype.getReceivedCredentials = function () {
  return getAllCredentials(this.store.getState().receivedCredentials)
}

RIFIdHolder.prototype.addReceivedCredential = function (this: RIFIdHolderInterface, credential: Credential) {
  addReceivedCredential(this.store.dispatch)(credential)
}

export default RIFIdHolder
