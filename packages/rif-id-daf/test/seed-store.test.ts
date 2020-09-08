import { Connection } from 'typeorm'
import { SecretBox } from 'daf-libsodium'
import { createSqliteConnection, deleteDatabase } from './util'
import { SeedStore } from '../src/seed-store'

const database = './rif-id-daf.seed-store.test.sqlite'

describe('seed store', () => {
  let dbConnection: Promise<Connection>

  beforeEach(async () => {
    dbConnection = createSqliteConnection(database)
  })

  afterEach(async () => {
    await deleteDatabase(await dbConnection, database)
  })

  test('with secret box', async () => {
    const secretKey = '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c'
    const seedStore = new SeedStore(dbConnection, new SecretBox(secretKey))

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
    const seedStore = new SeedStore(dbConnection)

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
