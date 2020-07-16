import { Connection } from 'typeorm'
import { KeyStore } from 'daf-core'
import { SecretBox, KeyManagementSystem } from 'daf-libsodium'
import { generateMnemonic, mnemonicToSeed, seedToRSKHDKey } from '@rsksmart/rif-id-mnemonic'
import { createSqliteConnection } from './util'
import { SeedStore } from '../src/seed-store';
import { RIFIdKeyManagementSystem } from '../src/key-management-system';
import { Key } from 'daf-libsodium/build/key-management-system'

describe('key management system', () => {
  let connection: Promise<Connection>;

  beforeEach(async () => {
    connection = createSqliteConnection('./rif-id-daf.kms.test.sqlite')
  });

  afterEach(async () => {
      await (await connection).close();
  });

  test('import mnemonic', async () => {
    const secretKey = '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c'
    const secretBox = new SecretBox(secretKey)
    const keyManagementSystem = new KeyManagementSystem(new KeyStore(connection, secretBox))

    const seedStore = new SeedStore(connection, secretBox)
    const rifIdKeyManagementSystem = new RIFIdKeyManagementSystem(keyManagementSystem, seedStore)

    const mnemonic = generateMnemonic(12)
    await rifIdKeyManagementSystem.importMnemonic(mnemonic)

    const seed = await mnemonicToSeed(mnemonic)

    const identitySeed = await seedStore.get()
    expect(identitySeed.seedHex).toEqual(seed.toString('hex'))

    expect(rifIdKeyManagementSystem.importMnemonic(generateMnemonic(12))).rejects.toThrow()
  })

  test('create keys', async () => {
    const secretKey = '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c'
    const secretBox = new SecretBox(secretKey)
    const keyManagementSystem = new KeyManagementSystem(new KeyStore(connection, secretBox))

    const seedStore = new SeedStore(connection, secretBox)
    const rifIdKeyManagementSystem = new RIFIdKeyManagementSystem(keyManagementSystem, seedStore)

    const mnemonic = generateMnemonic(12)
    await rifIdKeyManagementSystem.importMnemonic(mnemonic)

    const seed = await mnemonicToSeed(mnemonic)
    const hdKey = seedToRSKHDKey(seed)

    const key1 = await rifIdKeyManagementSystem.createKey('Secp256k1')

    expect(key1.serialized.privateKeyHex).toEqual(hdKey.derive(0).privateKey.toString('hex'))
    expect(key1.serialized.publicKeyHex).toEqual(hdKey.derive(0).publicKey.toString('hex'))

    const key2 = await rifIdKeyManagementSystem.createKey('Secp256k1')

    expect(key2.serialized.privateKeyHex).toEqual(hdKey.derive(1).privateKey.toString('hex'))
    expect(key2.serialized.publicKeyHex).toEqual(hdKey.derive(1).publicKey.toString('hex'))
  })

  test('get keys', async () => {
    const secretKey = '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c'
    const secretBox = new SecretBox(secretKey)
    const keyManagementSystem = new KeyManagementSystem(new KeyStore(connection, secretBox))

    const seedStore = new SeedStore(connection, secretBox)
    const rifIdKeyManagementSystem = new RIFIdKeyManagementSystem(keyManagementSystem, seedStore)

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
    const keyManagementSystem = new KeyManagementSystem(new KeyStore(connection, secretBox))

    const seedStore = new SeedStore(connection, secretBox)
    const rifIdKeyManagementSystem = new RIFIdKeyManagementSystem(keyManagementSystem, seedStore)

    const mnemonic = generateMnemonic(12)
    await rifIdKeyManagementSystem.importMnemonic(mnemonic)

    const key = await rifIdKeyManagementSystem.createKey('Secp256k1')
    await rifIdKeyManagementSystem.deleteKey((key as Key).serialized.kid)

    expect(rifIdKeyManagementSystem.getKey((key as Key).serialized.kid)).rejects.toThrow()
  })
})
