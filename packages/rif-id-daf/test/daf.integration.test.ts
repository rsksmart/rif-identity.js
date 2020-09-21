import { Connection } from 'typeorm'
import { KeyStore, IdentityStore, Agent } from 'daf-core'
import { SecretBox, KeyManagementSystem } from 'daf-libsodium'
import { generateMnemonic, mnemonicToSeed, seedToRSKHDKey } from '@rsksmart/rif-id-mnemonic'
import { rskAddressFromPrivateKey } from '@rsksmart/rif-id-ethr-did'
import { createSqliteConnection, resetDatabase, deleteDatabase } from './util'
import { MnemonicStore } from '../src/mnemonic-store'
import { RIFIdKeyManagementSystem } from '../src/key-management-system'
import { RIFIdentityProvider } from '../src/identity-provider'

const database = './rif-id-daf.agent.test.sqlite'

describe('agent - network %s', () => {
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

  test.each([
    ['rsk'],
    ['rsk:testnet']
  ])('create identity - network %s', async (network) => {
    const secretKey = '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c'
    const secretBox = new SecretBox(secretKey)
    const keyStore = new KeyStore(dbConnection, secretBox)
    const keyManagementSystem = new KeyManagementSystem(keyStore)

    const mnemonicStore = new MnemonicStore(dbConnection, secretBox)
    const rifIdKeyManagementSystem = new RIFIdKeyManagementSystem(keyManagementSystem, keyStore, mnemonicStore)

    const identityProvider = new RIFIdentityProvider({
      kms: rifIdKeyManagementSystem,
      identityStore: new IdentityStore('rsk-ethr', dbConnection),
      network,
      rpcUrl: 'http://localhost:8545'
    })

    const agent = new Agent({
      dbConnection,
      identityProviders: [identityProvider],
      didResolver: null
    })

    const mnemonic = generateMnemonic(12)

    await identityProvider.importMnemonic(mnemonic)

    const identity = await agent.identityManager.createIdentity()

    const seed = await mnemonicToSeed(mnemonic)
    const hdKey = await seedToRSKHDKey(seed)

    const privateKey = hdKey.derive(0).privateKey.toString('hex')
    const rskAddress = rskAddressFromPrivateKey(privateKey)

    const expectedPrefix = `did:ethr:${network}`

    expect(identity.did).toEqual(`${expectedPrefix}:${rskAddress.toLowerCase()}`)

    expect(identity.did.slice(0, expectedPrefix.length + 3)).toEqual(`${expectedPrefix}:0x`)
    expect(identity.did.slice(expectedPrefix.length + 3)).toHaveLength(40)

    const identity2 = await agent.identityManager.createIdentity()

    const privateKey2 = hdKey.derive(1).privateKey.toString('hex')
    const rskAddress2 = rskAddressFromPrivateKey(privateKey2)

    expect(identity2.did).toEqual(`${expectedPrefix}:${rskAddress2.toLowerCase()}`)

    expect(identity2.did.slice(0, expectedPrefix.length + 3)).toEqual(`${expectedPrefix}:0x`)
    expect(identity2.did.slice(expectedPrefix.length + 3)).toHaveLength(40)

    expect(identity.did).not.toEqual(identity2.did)
  })
})
