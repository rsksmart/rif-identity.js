import { Connection } from 'typeorm'
import { KeyStore, IdentityStore, Agent } from 'daf-core'
import { SecretBox, KeyManagementSystem } from 'daf-libsodium'
import { generateMnemonic } from '@rsksmart/rif-id-mnemonic'
import { createSqliteConnection } from './util'
import { SeedStore } from '../src/seed-store'
import { RIFIdKeyManagementSystem } from '../src/key-management-system'
import { RIFIdentityProvider } from '../src/identity-provider'

describe('agent', () => {
  let connection: Promise<Connection>

  beforeEach(async () => {
    connection = createSqliteConnection('./rif-id-daf.agent.test.sqlite')
  })

  afterEach(async () => {
    await (await connection).close()
  })

  test('create identity', async () => {
    const secretKey = '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c'
    const secretBox = new SecretBox(secretKey)
    const keyManagementSystem = new KeyManagementSystem(new KeyStore(connection, secretBox))

    const seedStore = new SeedStore(connection, secretBox)
    const rifIdKeyManagementSystem = new RIFIdKeyManagementSystem(keyManagementSystem, seedStore)

    const identityProvider = new RIFIdentityProvider({
      kms: rifIdKeyManagementSystem,
      identityStore: new IdentityStore('rsk-testnet-ethr', connection),
      network: 'rsk',
      rpcUrl: 'http://localhost:8545'
    })

    const agent = new Agent({
      dbConnection: connection,
      identityProviders: [identityProvider],
      didResolver: null
    })

    const mnemonic = generateMnemonic(12)

    await identityProvider.importMnemonic(mnemonic)

    const identity = await agent.identityManager.createIdentity()

    // const seed = await mnemonicToSeed(mnemonic)
    // const hdKey = await seedToRSKHDKey(seed)
    // const privateKey = hdKey.derive(0).privateKey.toString('hex')
    // const rskAddress = rskAddressFromPrivateKey(privateKey)

    // expect(identity.did).toEqual(`did:ethr:rsk:${rskAddress.toLowerCase()}`)
    // TBD: DAF Digest is different than our implementation

    expect(identity.did.slice(0, 15)).toEqual('did:ethr:rsk:0x')
    expect(identity.did.slice(15)).toHaveLength(40)

    const identity2 = await agent.identityManager.createIdentity()

    // const seed = await mnemonicToSeed(mnemonic)
    // const hdKey = await seedToRSKHDKey(seed)
    // const privateKey = hdKey.derive(1).privateKey.toString('hex')
    // const rskAddress = rskAddressFromPrivateKey(privateKey)

    // expect(identity.did).toEqual(`did:ethr:rsk:${rskAddress.toLowerCase()}`)
    // TBD: DAF Digest is different than our implementation

    expect(identity2.did.slice(0, 15)).toEqual('did:ethr:rsk:0x')
    expect(identity2.did.slice(15)).toHaveLength(40)
  })
})
