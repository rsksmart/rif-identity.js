import { createConnection, Connection } from 'typeorm'
import { Entities as DAFEntities, Identity } from 'daf-core'
import { Entities, IdentitySeed } from '../src/entities'

describe('entities', () => {
  let connection: Connection;

  beforeEach(async () => {
      connection = await createConnection({
          type: 'sqlite',
          database: './rif-id-daf.entities.test.sqlite',
          entities: [...Entities, ...DAFEntities],
          logging: false,
          dropSchema: true, // Isolate each test case
          synchronize: true
      });
  });

  afterEach(async () => {
      await connection.close();
  });

  test('save identity to DB', async () => {
    const did = 'did:test:123'
    const identity = new Identity()
    identity.did = did
    await identity.save()

    const seedHex = '0123abcd'
    const identitySeed = new IdentitySeed(seedHex)
    await identitySeed.save()

    const identityFromDb = await Identity.findOne(identity.did)
    if (!identityFromDb) throw 'Error'
    expect(identityFromDb.did).toEqual(did)

    const identitySeedFromDb = await IdentitySeed.findOne(0)
    if (!identitySeedFromDb) throw 'Error'
    expect(identitySeedFromDb.seedHex).toEqual(seedHex)
  })
})
