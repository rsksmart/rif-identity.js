import { createConnection } from 'typeorm'
import { Entities as DAFEntities, IdentityStore, KeyStore, Agent } from 'daf-core'
import { Entities, SeedStore, RIFIdKeyManagementSystem, RIFIdentityProvider } from '@rsksmart/rif-id-daf'
import { SecretBox, KeyManagementSystem } from 'daf-libsodium'

export const setupAgent = (database: string) => {
  const connection = createConnection({
    type: 'sqlite',
    database,
    entities: [...Entities, ...DAFEntities],
    logging: false,
    dropSchema: true, // Isolate each test case
    synchronize: true
  })

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

  return new Agent({
    dbConnection: connection,
    identityProviders: [identityProvider],
    didResolver: null
  })
}
