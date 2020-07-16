import { Connection } from 'typeorm'
import { AbstractSecretBox } from 'daf-core'
import { IdentitySeed } from './entities'
import { AbstractSeedStore } from './abstract-seed-store'

import Debug from 'debug'
const debug = Debug('daf:key-store')

export class SeedStore extends AbstractSeedStore {
  constructor (private dbConnection: Promise<Connection>, private secretBox?: AbstractSecretBox) {
    super()
    if (!secretBox) {
      console.warn('Please provide SecretBox to the KeyStore')
    }
  }

  async create (seed: string) {
    const identitySeed = new IdentitySeed(seed)
    if (this.secretBox) {
      identitySeed.seedHex = await this.secretBox.encrypt(identitySeed.seedHex)
    }
    debug('Saving seed')
    await (await this.dbConnection).getRepository(IdentitySeed).save(identitySeed)
    return true
  }

  async set (id: number, seed: string) {
    const identitySeed = new IdentitySeed(seed)
    identitySeed.id = id
    if (this.secretBox) {
      identitySeed.seedHex = await this.secretBox.encrypt(identitySeed.seedHex)
    }
    debug('Saving seed')
    await (await this.dbConnection).getRepository(IdentitySeed).save(identitySeed)
    return true
  }

  async increment (id: number) {
    const identitySeed = await (await this.dbConnection).getRepository(IdentitySeed).findOne(id)
    identitySeed.derivationCount = identitySeed.derivationCount + 1
    debug('Incrementing seed count')
    await (await this.dbConnection).getRepository(IdentitySeed).save(identitySeed)
    return true
  }

  async get () {
    const identitySeed = await (await this.dbConnection).getRepository(IdentitySeed).findOne()
    if (!identitySeed) throw Error('Key not found')
    if (this.secretBox && identitySeed) {
      identitySeed.seedHex = await this.secretBox.decrypt(identitySeed.seedHex)
    }
    return identitySeed
  }

  async delete () {
    const identitySeed = await (await this.dbConnection).getRepository(IdentitySeed).findOne()
    if (!identitySeed) throw Error('Key not found')
    debug('Deleting seed')
    await (await this.dbConnection).getRepository(IdentitySeed).remove(identitySeed)
    return true
  }

  async exist () {
    const count = await (await this.dbConnection).getRepository(IdentitySeed).count()
    return count > 0
  }
}
