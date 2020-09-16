import { Connection } from 'typeorm'
import { SecretBox } from 'daf-libsodium'
import { createSqliteConnection, resetDatabase, deleteDatabase } from './util'
import { MnemonicStore } from '../src/mnemonic-store'

const database = './rif-id-daf.mnemonic-store.test.sqlite'

describe('mnemonic store', () => {
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

  test('with secret box', async () => {
    const secretKey = '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c'
    const mnemonicStore = new MnemonicStore(dbConnection, new SecretBox(secretKey))

    const mnemonic = 'rude position remind bulb ivory donor kiwi suspect panther dolphin broken chapter'
    await mnemonicStore.create(mnemonic)

    let resultingMnemonic = await mnemonicStore.get()

    expect(resultingMnemonic.derivationCount).toEqual(0)
    expect(resultingMnemonic.mnemonic).toEqual(mnemonic)

    const newMnemonic = 'clean crucial elite garment sick giraffe menu flag pact index crisp shaft'

    await mnemonicStore.set(resultingMnemonic.id, newMnemonic)

    resultingMnemonic = await mnemonicStore.get()

    expect(resultingMnemonic.derivationCount).toEqual(0)
    expect(resultingMnemonic.mnemonic).toEqual(newMnemonic)

    await mnemonicStore.delete()

    expect(mnemonicStore.get()).rejects.toThrow()
  })

  test('without secret box', async () => {
    const mnemonicStore = new MnemonicStore(dbConnection)

    const mnemonic = 'roast aerobic twenty nephew gap diamond connect burst follow intact shove prize'
    await mnemonicStore.create(mnemonic)

    let resultingMnemonic = await mnemonicStore.get()

    expect(resultingMnemonic.derivationCount).toEqual(0)
    expect(resultingMnemonic.mnemonic).toEqual(mnemonic)

    const newMnemonic = 'danger rough myth portion couple enable survey fetch cram unhappy rare glimpse'

    await mnemonicStore.set(resultingMnemonic.id, newMnemonic)

    resultingMnemonic = await mnemonicStore.get()

    expect(resultingMnemonic.derivationCount).toEqual(0)
    expect(resultingMnemonic.mnemonic).toEqual(newMnemonic)

    await mnemonicStore.delete()

    expect(mnemonicStore.get()).rejects.toThrow()
  })
})
