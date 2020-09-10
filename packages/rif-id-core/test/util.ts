import { createConnection } from 'typeorm'
import * as Daf from 'daf-core'
import { SecretBox, KeyManagementSystem } from 'daf-libsodium'
import { Entities, MnemonicStore, RIFIdKeyManagementSystem, RIFIdentityProvider } from '@rsksmart/rif-id-daf'
import { DafResolver } from 'daf-resolver'
import fs from 'fs'
import { DeclarativeDetail } from '../src/entities/DeclarativeDetail'

const network = 'rsk:testnet'
const rpcUrl = 'https://did.testnet.rsk.co:4444'

type CreateAgentOptions = {
  mnemonic?: string
  declarativeDetailsFeature?: boolean
}

export const createAgent = async (database: string, {
  mnemonic,
  declarativeDetailsFeature = false
}: CreateAgentOptions) => {
  /* setup db */
  let entities: any[] = [...Entities, ...Daf.Entities]
  if (declarativeDetailsFeature) entities.push(DeclarativeDetail)

  const dbConnection = createConnection({
    name: database,
    type: 'sqlite',
    database,
    entities,
    logging: false,
    synchronize: true
  })

  /* setup identity provider */
  const secretKey = '8b5bbbc3ee2d33608e6abc77b872122f95c4d1ca0c24dfa48281ed227321d160'
  const secretBox = new SecretBox(secretKey)
  const keyStore = new Daf.KeyStore(dbConnection, secretBox)
  const mnemonicStore = new MnemonicStore(dbConnection, secretBox)

  const kms = new RIFIdKeyManagementSystem(new KeyManagementSystem(keyStore), keyStore, mnemonicStore)
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

export const deleteDatabase = (agent: Daf.Agent, database: string) => agent.dbConnection.then(connection => connection.close().then(() => {
  if (fs.existsSync(database)) fs.unlinkSync(database)
}))

export const did = 'did:ethr:rsk:0xf3beac30c498d9e26865f34fcaa57dbb935b0d74'
export const did2 = 'did:ethr:rsk:0xdcbe93e98e0dcebe677c39a84f5f212b85ba7ef0'
