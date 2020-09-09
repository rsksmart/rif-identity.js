import { Connection } from 'typeorm'
import { AbstractSecretBox } from 'daf-core'
import { IdentityMnemonic } from './entities'
import { AbstractMnemonicStore } from './abstract-mnemonic-store'

import Debug from 'debug'
const debug = Debug('daf:key-store')

export class MnemonicStore extends AbstractMnemonicStore {
  constructor (private dbConnection: Promise<Connection>, private secretBox?: AbstractSecretBox) {
    super()
    if (!secretBox) {
      console.warn('Please provide SecretBox to the KeyStore')
    }
  }

  async create (mnemonic: string) {
    const identityMnemonic = new IdentityMnemonic(mnemonic)
    if (this.secretBox) {
      identityMnemonic.mnemonic = await this.secretBox.encrypt(identityMnemonic.mnemonic)
    }
    debug('Saving mnemonic')
    await (await this.dbConnection).getRepository(IdentityMnemonic).save(identityMnemonic)
    return true
  }

  async set (id: number, mnemonic: string) {
    const identityMnemonic = new IdentityMnemonic(mnemonic)
    identityMnemonic.id = id
    if (this.secretBox) {
      identityMnemonic.mnemonic = await this.secretBox.encrypt(identityMnemonic.mnemonic)
    }
    debug('Saving mnemonic')
    await (await this.dbConnection).getRepository(IdentityMnemonic).save(identityMnemonic)
    return true
  }

  async increment (id: number) {
    const identityMnemonic = await (await this.dbConnection).getRepository(IdentityMnemonic).findOne(id)
    identityMnemonic.derivationCount = identityMnemonic.derivationCount + 1
    debug('Incrementing mnemonic count')
    await (await this.dbConnection).getRepository(IdentityMnemonic).save(identityMnemonic)
    return true
  }

  async get () {
    const identityMnemonic = await (await this.dbConnection).getRepository(IdentityMnemonic).findOne()
    if (!identityMnemonic) throw Error('Key not found')
    if (this.secretBox && identityMnemonic) {
      identityMnemonic.mnemonic = await this.secretBox.decrypt(identityMnemonic.mnemonic)
    }
    return identityMnemonic
  }

  async delete () {
    const identityMnemonic = await (await this.dbConnection).getRepository(IdentityMnemonic).findOne()
    if (!identityMnemonic) throw Error('Key not found')
    debug('Deleting mnemonic')
    await (await this.dbConnection).getRepository(IdentityMnemonic).remove(identityMnemonic)
    return true
  }

  async exist () {
    const count = await (await this.dbConnection).getRepository(IdentityMnemonic).count()
    return count > 0
  }
}
