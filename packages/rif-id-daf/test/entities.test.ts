import { Connection } from 'typeorm'
import { Identity } from 'daf-core'
import { IdentitySeed } from '../src/entities'
import { createSqliteConnection, deleteDatabase } from './util'

const database = './rif-id-daf.entities.test.sqlite'

describe('entities', () => {
  let connection: Connection

  beforeEach(async () => {
    connection = await createSqliteConnection(database)
  })

  afterEach(async () => {
    await deleteDatabase(connection, database)
  })

  test('save identity to DB', async () => {
    const did = 'did:test:123'
    const identity = new Identity()
    identity.did = did
    await identity.save()

    const seedHex = '0123abcd'
    const identitySeed = new IdentitySeed(seedHex)
    await identitySeed.save()

    const identityFromDb = await Identity.findOne(identity.did)
    if (!identityFromDb) throw new Error('Error')
    expect(identityFromDb.did).toEqual(did)

    const identitySeedFromDb = await IdentitySeed.findOne()
    if (!identitySeedFromDb) throw new Error('Error')
    expect(identitySeedFromDb.seedHex).toEqual(seedHex)
  })
})
