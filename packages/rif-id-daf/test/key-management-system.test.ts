import { Connection } from 'typeorm'
import { KeyStore } from 'daf-core'
import { SecretBox, KeyManagementSystem } from 'daf-libsodium'
import { generateMnemonic, mnemonicToSeed, seedToRSKHDKey } from '@rsksmart/rif-id-mnemonic'
import { ecKeyFromPrivate, publicFromEcKey } from '@rsksmart/rif-id-ethr-did/lib/rskAddress'
import { createSqliteConnection, resetDatabase, deleteDatabase } from './util'
import { MnemonicStore } from '../src/mnemonic-store'
import { RIFIdKeyManagementSystem } from '../src/key-management-system'
import { Key } from 'daf-libsodium/build/key-management-system'

const database = './rif-id-daf.kms.test.sqlite'

describe('key management system', () => {
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

  test('import mnemonic', async () => {
    const secretKey = '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c'
    const secretBox = new SecretBox(secretKey)
    const keyStore = new KeyStore(dbConnection, secretBox)
    const keyManagementSystem = new KeyManagementSystem(keyStore)

    const mnemonicStore = new MnemonicStore(dbConnection, secretBox)
    const rifIdKeyManagementSystem = new RIFIdKeyManagementSystem(keyManagementSystem, keyStore, mnemonicStore)

    const mnemonic = generateMnemonic(12)
    await rifIdKeyManagementSystem.importMnemonic(mnemonic)

    const identityMnemonic = await mnemonicStore.get()
    expect(identityMnemonic.mnemonic).toEqual(mnemonic)

    expect(rifIdKeyManagementSystem.importMnemonic(generateMnemonic(12))).rejects.toThrow()
  })

  test('create keys', async () => {
    const secretKey = '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c'
    const secretBox = new SecretBox(secretKey)
    const keyStore = new KeyStore(dbConnection, secretBox)
    const keyManagementSystem = new KeyManagementSystem(keyStore)

    const mnemonicStore = new MnemonicStore(dbConnection, secretBox)
    const rifIdKeyManagementSystem = new RIFIdKeyManagementSystem(keyManagementSystem, keyStore, mnemonicStore)

    const mnemonic = generateMnemonic(12)
    await rifIdKeyManagementSystem.importMnemonic(mnemonic)

    const seed = await mnemonicToSeed(mnemonic)
    const hdKey = seedToRSKHDKey(seed)

    const key1 = await rifIdKeyManagementSystem.createKey('Secp256k1')

    const privateKey1 = hdKey.derive(0).privateKey.toString('hex')

    expect(key1.serialized.privateKeyHex).toEqual(privateKey1)
    expect(key1.serialized.publicKeyHex).toEqual(
      '0x' + publicFromEcKey(ecKeyFromPrivate(privateKey1)).toString('hex')
    )

    const key2 = await rifIdKeyManagementSystem.createKey('Secp256k1')

    const privateKey2 = hdKey.derive(1).privateKey.toString('hex')

    expect(key2.serialized.privateKeyHex).toEqual(privateKey2)
    expect(key2.serialized.publicKeyHex).toEqual(
      '0x' + publicFromEcKey(ecKeyFromPrivate(privateKey2)).toString('hex')
    )
  })

  test('get keys', async () => {
    const secretKey = '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c'
    const secretBox = new SecretBox(secretKey)
    const keyStore = new KeyStore(dbConnection, secretBox)
    const keyManagementSystem = new KeyManagementSystem(keyStore)

    const mnemonicStore = new MnemonicStore(dbConnection, secretBox)
    const rifIdKeyManagementSystem = new RIFIdKeyManagementSystem(keyManagementSystem, keyStore, mnemonicStore)

    const mnemonic = generateMnemonic(12)
    await rifIdKeyManagementSystem.importMnemonic(mnemonic)

    const key = await rifIdKeyManagementSystem.createKey('Secp256k1')
    const resultKey = await rifIdKeyManagementSystem.getKey((key as Key).serialized.kid)

    expect(resultKey.serialized.privateKeyHex).toEqual(key.serialized.privateKeyHex)
    expect(resultKey.serialized.publicKeyHex).toEqual(key.serialized.publicKeyHex)
  })

  test('delete keys', async () => {
    const secretKey = '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c'
    const secretBox = new SecretBox(secretKey)
    const keyStore = new KeyStore(dbConnection, secretBox)
    const keyManagementSystem = new KeyManagementSystem(keyStore)

    const mnemonicStore = new MnemonicStore(dbConnection, secretBox)
    const rifIdKeyManagementSystem = new RIFIdKeyManagementSystem(keyManagementSystem, keyStore, mnemonicStore)

    const mnemonic = generateMnemonic(12)
    await rifIdKeyManagementSystem.importMnemonic(mnemonic)

    const key = await rifIdKeyManagementSystem.createKey('Secp256k1')
    await rifIdKeyManagementSystem.deleteKey((key as Key).serialized.kid)

    expect(rifIdKeyManagementSystem.getKey((key as Key).serialized.kid)).rejects.toThrow()
  })
})
