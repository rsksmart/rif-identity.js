import { Connection } from 'typeorm'
import { Identity } from 'daf-core'
import { IdentityMnemonic } from '../src/entities'
import { createSqliteConnection, deleteDatabase } from './util'

const database = './rif-id-daf.entities.test.sqlite'

jest.setTimeout(10000)

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
