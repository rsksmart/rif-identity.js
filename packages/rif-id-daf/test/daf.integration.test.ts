import { Connection } from 'typeorm'
import { KeyStore, IdentityStore, Agent } from 'daf-core'
import { SecretBox, KeyManagementSystem } from 'daf-libsodium'
import { generateMnemonic, mnemonicToSeed, seedToRSKHDKey } from '@rsksmart/rif-id-mnemonic'
import { rskAddressFromPrivateKey } from '@rsksmart/rif-id-ethr-did'
import { createSqliteConnection, deleteDatabase } from './util'
import { MnemonicStore } from '../src/mnemonic-store'
import { RIFIdKeyManagementSystem } from '../src/key-management-system'
import { RIFIdentityProvider } from '../src/identity-provider'

const database = './rif-id-daf.agent.test.sqlite'

describe('agent', () => {
  let dbConnection: Promise<Connection>

  beforeEach(async () => {
    dbConnection = createSqliteConnection(database)
  })

  afterEach(async () => {
    await deleteDatabase(await dbConnection, database)
  })

  test('create identity', async () => {
    const secretKey = '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c'
    const secretBox = new SecretBox(secretKey)
    const keyStore = new KeyStore(dbConnection, secretBox)
    const keyManagementSystem = new KeyManagementSystem(keyStore)

    const mnemonicStore = new MnemonicStore(dbConnection, secretBox)
    const rifIdKeyManagementSystem = new RIFIdKeyManagementSystem(keyManagementSystem, keyStore, mnemonicStore)

    const identityProvider = new RIFIdentityProvider({
      kms: rifIdKeyManagementSystem,
      identityStore: new IdentityStore('rsk-testnet-ethr', dbConnection),
      network: 'rsk',
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

    expect(identity.did).toEqual(`did:ethr:rsk:${rskAddress.toLowerCase()}`)

    expect(identity.did.slice(0, 15)).toEqual('did:ethr:rsk:0x')
    expect(identity.did.slice(15)).toHaveLength(40)

    const identity2 = await agent.identityManager.createIdentity()

    const privateKey2 = hdKey.derive(1).privateKey.toString('hex')
    const rskAddress2 = rskAddressFromPrivateKey(privateKey2)

    expect(identity2.did).toEqual(`did:ethr:rsk:${rskAddress2.toLowerCase()}`)

    expect(identity2.did.slice(0, 15)).toEqual('did:ethr:rsk:0x')
    expect(identity2.did.slice(15)).toHaveLength(40)

    expect(identity.did).not.toEqual(identity2.did)
  })
})
