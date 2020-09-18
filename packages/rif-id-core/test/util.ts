import { createConnection, Connection } from 'typeorm'
import * as Daf from 'daf-core'
import { SecretBox, KeyManagementSystem } from 'daf-libsodium'
import { Entities, MnemonicStore, RIFIdKeyManagementSystem, RIFIdentityProvider } from '@rsksmart/rif-id-daf'
import { DafResolver } from 'daf-resolver'
import { JwtMessageHandler } from 'daf-did-jwt'
import { W3cMessageHandler, W3cActionHandler, ActionSignW3cVc } from 'daf-w3c'
import fs from 'fs'
import express from 'express'
import bodyParser from 'body-parser'
import { DeclarativeDetail, CredentialRequest } from '../src/entities'
import { generateMnemonic } from '@rsksmart/rif-id-mnemonic'
import { DIDCommMessageHandler, DIDCommActionHandler } from 'daf-did-comm'
import { SdrMessageHandler, SdrActionHandler } from 'daf-selective-disclosure'

const network = 'rsk:testnet'

type CreateAgentOptions = {
  mnemonic?: string
  declarativeDetailsFeature?: boolean
  credentialRequestsFeature?: boolean
  rpcUrl?: string
  registryAddress?: string
}

const getEntities = (declarativeDetailsFeature: boolean, credentialRequestsFeature: boolean) => {
  const entities: any[] = [...Entities, ...Daf.Entities]
  if (declarativeDetailsFeature) entities.push(DeclarativeDetail)
  if (credentialRequestsFeature) entities.push(CredentialRequest)
  return entities
}

export const createSqliteConnection = (database: string, declarativeDetailsFeature: boolean = false, credentialRequestsFeature: boolean = false) => createConnection({
  name: database,
  type: 'sqlite',
  database,
  entities: getEntities(declarativeDetailsFeature, credentialRequestsFeature),
  logging: false,
  synchronize: true
})

export const createAgent = async (database: string | Promise<Connection>, {
  mnemonic,
  declarativeDetailsFeature = false,
  credentialRequestsFeature = false,
  rpcUrl = 'https://did.testnet.rsk.co:4444',
  registryAddress = '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b'
}: CreateAgentOptions) => {
  /* setup db */
  let dbConnection: Promise<Connection>

  if (typeof database === 'string') {
    dbConnection = createSqliteConnection(database, declarativeDetailsFeature, credentialRequestsFeature)
  } else {
    dbConnection = database
  }

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
  const didResolver = new DafResolver({
    networks: [
      { name: network, registry: registryAddress, rpcUrl }
    ]
  })

  const messageHandler = new JwtMessageHandler()
  messageHandler.setNext(new W3cMessageHandler())
    .setNext(new SdrMessageHandler())
    .setNext(new DIDCommMessageHandler())

  const actionHandler = new W3cActionHandler()
  actionHandler.setNext(new SdrActionHandler())
    .setNext(new DIDCommActionHandler())

  const agent = new Daf.Agent({
    dbConnection,
    identityProviders,
    didResolver: didResolver as any,
    messageHandler: messageHandler as any,
    actionHandler: actionHandler as any
  })

  if (mnemonic) {
    await kms.importMnemonic(mnemonic)
  }

  return agent
}

export const resetDatabase = async (dbConnection: Promise<Connection>) => {
  if ((await dbConnection).isConnected) {
    await (await dbConnection).dropDatabase()
    await (await dbConnection).synchronize()
  }
}

export const expectIsIdentity = (identity: string) => {
  expect(identity.slice(0, 23)).toEqual('did:ethr:rsk:testnet:0x')
  expect(/^[0-9a-f]{40}$/i.test(identity.slice(23))).toBeTruthy()
}

export const deleteDatabase = (agent: Daf.Agent, database: string) => agent.dbConnection.then(connection => connection.close().then(() => {
  if (fs.existsSync(database)) fs.unlinkSync(database)
}))

export const did = 'did:ethr:rsk:testnet:0xf3beac30c498d9e26865f34fcaa57dbb935b0d74'
export const did2 = 'did:ethr:rsk:testnet:0xdcbe93e98e0dcebe677c39a84f5f212b85ba7ef0'
export const did3 = 'did:ethr:rsk:testnet:0xbe935f08e079e7a7c898bcbde5dceba214fe6f2'

export const issueTestCredential = async (subject: string): Promise<Daf.Credential> => {
  const mnemonic = generateMnemonic(12)
  const database = `test.rif-id-core.credentials.issuer.${new Date().getTime()}.sqlite`
  const agent = await createAgent(database, { mnemonic: mnemonic })

  const identity = await agent.identityManager.createIdentity()

  const credentialPayload = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuanceDate: Date.now().toString(),
    expirationDate: new Date(+Date.now() + 31556952000).toString(), // 1 year
    issuer: identity.did,
    credentialSubject: {
      id: subject,
      someData: 'someData'
    }
  }

  const vc = await agent.handleAction({
    type: 'sign.w3c.vc.jwt',
    save: false,
    data: credentialPayload
  } as ActionSignW3cVc)

  await deleteDatabase(agent, database)

  return vc
}

export const importMnemonic = (agent: Daf.Agent, mnemonic: string) => ((agent.identityManager.getIdentityProviders()[0] as any)._kms.importMnemonic(mnemonic))

export const startTestIssuerServer = (handle: any) => {
  const app = express()
  app.use(bodyParser.text())

  app.post('/request_credential', function(req, res) {
    const jwt = req.body
    res.status(200).send('')
  })

  return app.listen(handle)
}
