import { AbstractKeyManagementSystem, KeyType } from 'daf-core'
import { mnemonicToSeed, seedToRSKHDKey } from '@rsksmart/rif-id-mnemonic'
import { ecKeyFromPrivate, publicFromEcKey } from '@rsksmart/rif-id-ethr-did/lib/rskAddress'
import { SeedStore } from './seed-store'
import Debug from 'debug'
const debug = Debug('daf:sodium:kms')

export class RIFIdKeyManagementSystem extends AbstractKeyManagementSystem {
  constructor (private baseSystem: AbstractKeyManagementSystem, private seedStore: SeedStore) {
    super()
  }

  async importMnemonic (mnemonic: string) {
    const existSeed = await this.seedStore.exist()
    if (existSeed) throw new Error('Seed already exists')

    const seed = await mnemonicToSeed(mnemonic)
    await this.seedStore.create(seed.toString('hex'))

    return true
  }

  async createKey (type: KeyType) {
    if (!(type === 'Secp256k1')) return this.baseSystem.createKey(type)

    const existSeed = await this.seedStore.exist()
    if (!existSeed) throw new Error('Seed not existent')

    const seed = await this.seedStore.get()

    const hdKey = await seedToRSKHDKey(Buffer.from(seed.seedHex, 'hex'))
    const derivedKey = hdKey.derive(seed.derivationCount)
    const privateKeyHex = derivedKey.privateKey?.toString('hex')
    const ecKey = ecKeyFromPrivate(privateKeyHex)
    const publicKeyHex = '0x' + publicFromEcKey(ecKey).toString('hex')

    const serializedKey = {
      type,
      kid: publicKeyHex,
      publicKeyHex,
      privateKeyHex
    }

    const key = await this.baseSystem.importKey(serializedKey)

    debug('Created key', type, serializedKey.publicKeyHex)

    await this.seedStore.increment(seed.id)
    return key
  }

  async getKey (kid: string) {
    return this.baseSystem.getKey(kid)
  }

  async deleteKey (kid: string) {
    return this.baseSystem.deleteKey(kid)
  }
}
