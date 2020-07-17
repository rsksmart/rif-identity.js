import {
  Credential, ReceivedCredentialsState, getAllCredentials, addReceivedCredential
} from '@rsksmart/rif-id-core-reducer/lib/receivedCredentials'
import { holderReducer } from '@rsksmart/rif-id-core-reducer'
import { Store, createStore } from 'redux'
import { Agent, EventTypes, Message, Credential as DafCredential } from 'daf-core'
import { pipe } from 'lodash/fp'
import { MessageTypes } from 'daf-w3c'

export interface RIFHolderStateInterface {
  receivedCredentials: ReceivedCredentialsState
}

export interface RIFIdHolderInterface {
  store: Store<RIFHolderStateInterface>
  agent: Agent,
  addReceivedCredential: (data: Credential) => void
  getReceivedCredentials: () => Credential[]
}

const RIFIdHolder = function (this: RIFIdHolderInterface, agent: Agent) {
  this.store = createStore(holderReducer)
  this.agent = agent

  this.agent.on(EventTypes.validatedMessage, function (message: Message) {
    if (message.type === MessageTypes.vc) {
      pipe(
        mapCredential,
        this.addReceivedCredential
      ).bind(this)(message.credentials[0])
    }
  }.bind(this))
} as any as ({ new (agent: Agent): RIFIdHolderInterface;})

RIFIdHolder.prototype.getReceivedCredentials = function () {
  return getAllCredentials(this.store.getState().receivedCredentials)
}

RIFIdHolder.prototype.addReceivedCredential = function (this: RIFIdHolderInterface, credential: Credential) {
  addReceivedCredential(this.store.dispatch)(credential)
}

const mapCredential = function (credential: DafCredential): Credential {
  return {
    issuer: credential.issuer.did,
    subject: credential.subject?.did,
    claims: credential.claims,
    hash: credential.hash,
    issuanceDate: credential.issuanceDate,
    context: credential.context,
    type: credential.type
  }
}

export default RIFIdHolder
