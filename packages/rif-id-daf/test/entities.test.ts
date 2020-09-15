import { Connection } from 'typeorm'
import { Identity } from 'daf-core'
import { IdentityMnemonic } from '../src/entities'
import { createSqliteConnection, resetDatabase, deleteDatabase } from './util'

const database = './rif-id-daf.entities.test.sqlite'

describe('entities', () => {
  let dbConnection: Promise<Connection>

  beforeAll(() => {
    dbConnection = createSqliteConnection(database)
  })

  beforeEach(async () => {
    await resetDatabase(dbConnection)
  })

  afterAll(async () => {
    deleteDatabase(await dbConnection, database)
  })

  test('save identity to DB', async () => {
    const did = 'did:test:123'
    const identity = new Identity()
    identity.did = did
    await identity.save()

    const mnemonic = 'suspect second utility scheme maze cheese chicken left beauty squeeze text adjust'
    const identityMnemonic = new IdentityMnemonic(mnemonic)
    await identityMnemonic.save()

    const identityFromDb = await Identity.findOne(identity.did)
    if (!identityFromDb) throw new Error('Error')
    expect(identityFromDb.did).toEqual(did)

    const identityMnemonicFromDb = await IdentityMnemonic.findOne()
    if (!identityMnemonicFromDb) throw new Error('Error')
    expect(identityMnemonicFromDb.mnemonic).toEqual(mnemonic)
  })
})
