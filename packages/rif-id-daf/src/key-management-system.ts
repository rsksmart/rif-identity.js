import { AbstractKeyManagementSystem, KeyType, KeyStore } from 'daf-core'
import { mnemonicToSeed, seedToRSKHDKey } from '@rsksmart/rif-id-mnemonic'
import { ecKeyFromPrivate, publicFromEcKey } from '@rsksmart/rif-id-ethr-did/lib/rskAddress'
import { MnemonicStore } from './mnemonic-store'
import Debug from 'debug'

const debug = Debug('daf:sodium:kms')

export class RIFIdKeyManagementSystem extends AbstractKeyManagementSystem {
  constructor (private baseSystem: AbstractKeyManagementSystem, private keyStore: KeyStore, private mnemonicStore: MnemonicStore) {
    super()
  }

  async importMnemonic (mnemonic: string) {
    const existMnemonic = await this.mnemonicStore.exist()
    if (existMnemonic) throw new Error('Mnemonic already exists')

    await this.mnemonicStore.create(mnemonic)

    return true
  }

  async createKey (type: KeyType) {
    if (!(type === 'Secp256k1')) return this.baseSystem.createKey(type)

    const existMnemonic = await this.mnemonicStore.exist()
    if (!existMnemonic) throw new Error('Mnemonic not existent')

    const identityMnemonic = await this.mnemonicStore.get()

    const seed = await mnemonicToSeed(identityMnemonic.mnemonic)
    const hdKey = await seedToRSKHDKey(seed)
    const derivedKey = hdKey.derive(identityMnemonic.derivationCount)
    const privateKeyHex = derivedKey.privateKey?.toString('hex')
    const ecKey = ecKeyFromPrivate(privateKeyHex)
    const publicKeyHex = '0x' + publicFromEcKey(ecKey).toString('hex')

    const serializedKey = {
      type,
      kid: publicKeyHex,
      publicKeyHex,
      privateKeyHex
    }

    await this.keyStore.set(serializedKey.kid, serializedKey)

    debug('Created key', type, serializedKey.publicKeyHex)

    await this.mnemonicStore.increment(identityMnemonic.id)
    return this.baseSystem.getKey(serializedKey.kid)
  }

  async getKey (kid: string) {
    return this.baseSystem.getKey(kid)
  }

  async deleteKey (kid: string) {
    return this.baseSystem.deleteKey(kid)
  }
}
