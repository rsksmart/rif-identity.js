import { Connection } from 'typeorm'
import { SecretBox } from 'daf-libsodium'
import { createSqliteConnection } from './util'
import { SeedStore } from '../src/seed-store'

describe('seed store', () => {
  let connection: Promise<Connection>

  beforeEach(async () => {
    connection = createSqliteConnection('./rif-id-daf.seed-store.test.sqlite')
  })

  afterEach(async () => {
    await (await connection).close()
  })

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
