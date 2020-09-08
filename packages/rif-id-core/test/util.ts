import { createConnection, Connection } from 'typeorm'
import * as Daf from 'daf-core'
import { SecretBox, KeyManagementSystem } from 'daf-libsodium'
import { Entities, SeedStore, RIFIdKeyManagementSystem, RIFIdentityProvider } from '@rsksmart/rif-id-daf'
import { DafResolver } from 'daf-resolver'

const network = 'rsk:testnet'
const rpcUrl = 'https://did.testnet.rsk.co:4444'

export const createAgent = async (database: string, mnemonic?: string) => {
  /* setup db */
  const dbConnection = createConnection({
    name: database,
    type: 'sqlite',
    database,
    entities: [...Entities, ...Daf.Entities],
    logging: false,
    synchronize: true
  })

  /* setup identity provider */
  const secretKey = '8b5bbbc3ee2d33608e6abc77b872122f95c4d1ca0c24dfa48281ed227321d160'
  const secretBox = new SecretBox(secretKey)
  const keyStore = new Daf.KeyStore(dbConnection, secretBox)
  const seedStore = new SeedStore(dbConnection, secretBox)

  const kms = new RIFIdKeyManagementSystem(new KeyManagementSystem(keyStore), keyStore, seedStore)
  const identityStore = new Daf.IdentityStore('rsk-testnet-ethr', dbConnection)

  const identityProvider = new RIFIdentityProvider({
    kms,
    identityStore,
    network,
    rpcUrl
  })

  const identityProviders = [identityProvider]

  /* setup did resolver */
  const didResolver = new DafResolver({ networks: [
    { name: network, registry: "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b", rpcUrl },
  ]})

  const agent = new Daf.Agent({
    dbConnection,
    identityProviders,
    didResolver
  })

  if(!!mnemonic) {
    await kms.importMnemonic(mnemonic)
  }

  return agent
}

export const expectIsIdentity = (identity: string) => {
  expect(identity.slice(0, 23)).toEqual('did:ethr:rsk:testnet:0x')
  expect(/^[0-9a-f]{40}$/i.test(identity.slice(23))).toBeTruthy()
}
