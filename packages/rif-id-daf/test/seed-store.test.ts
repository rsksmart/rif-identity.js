import { createConnection, Connection } from 'typeorm'
import { Entities as DAFEntities } from 'daf-core'
import { SecretBox } from 'daf-libsodium'
import { Entities } from '../src/entities'
import { SeedStore } from '../src/seed-store';

describe('entities', () => {
  let connection: Promise<Connection>;

  beforeEach(async () => {
    connection = createConnection({
      type: 'sqlite',
      database: './rif-id-daf.entities.test.sqlite',
      entities: [...Entities, ...DAFEntities],
      logging: false,
      dropSchema: true, // Isolate each test case
      synchronize: true
    });
  });

  afterEach(async () => {
      await (await connection).close();
  });

  test('with secret box', async () => {
    const secretKey = '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c'
    const seedStore = new SeedStore(connection, new SecretBox(secretKey))

    const seedHex = '0123abcd'
    await seedStore.create(seedHex)

    let resultingSeed = await seedStore.get()

    expect(resultingSeed.derivationCount).toEqual(0)
    expect(resultingSeed.seedHex).toEqual(seedHex)

    const newSeedHex = '456efgh'

    await seedStore.set(resultingSeed.id, newSeedHex)

    resultingSeed = await seedStore.get()

    expect(resultingSeed.derivationCount).toEqual(0)
    expect(resultingSeed.seedHex).toEqual(newSeedHex)

    await seedStore.delete()

    expect(seedStore.get()).rejects.toThrow()
  })


  test('without secret box', async () => {
    const seedStore = new SeedStore(connection)

    const seedHex = '0123abcd'
    await seedStore.create(seedHex)

    let resultingSeed = await seedStore.get()

    expect(resultingSeed.derivationCount).toEqual(0)
    expect(resultingSeed.seedHex).toEqual(seedHex)

    const newSeedHex = '456efgh'

    await seedStore.set(resultingSeed.id, newSeedHex)

    resultingSeed = await seedStore.get()

    expect(resultingSeed.derivationCount).toEqual(0)
    expect(resultingSeed.seedHex).toEqual(newSeedHex)

    await seedStore.delete()

    expect(seedStore.get()).rejects.toThrow()
  })
})
