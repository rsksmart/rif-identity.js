import { AbstractIdentityStore } from 'daf-core'
import { IdentityProvider } from 'daf-ethr-did'
import { RIFIdKeyManagementSystem } from './key-management-system'

export class RIFIdentityProvider extends IdentityProvider {
  private _kms: RIFIdKeyManagementSystem

  constructor (options: {
    kms: RIFIdKeyManagementSystem
    identityStore: AbstractIdentityStore
    network: string
    rpcUrl?: string
    web3Provider?: object
    ttl?: number
    gas?: number
    registry?: string
  }) {
    super(options)
    this._kms = options.kms
  }

  importMnemonic (mnemonic: string) {
    return this._kms.importMnemonic(mnemonic)
  }
}
