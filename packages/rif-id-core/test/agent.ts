import { KeyStore, IdentityStore, Agent, Entities as DAFEntities } from 'daf-core'
import { SecretBox, KeyManagementSystem } from 'daf-libsodium'
import { createConnection } from 'typeorm'
import { JwtMessageHandler } from 'daf-did-jwt'
import { W3cMessageHandler, W3cActionHandler } from 'daf-w3c'
import { SdrActionHandler, SdrMessageHandler } from 'daf-selective-disclosure'
import { DIDCommActionHandler } from 'daf-did-comm'
import { DafResolver } from 'daf-resolver'
import { IdentityProvider } from 'daf-ethr-did'

export default async (database: string) => {
  const connection = createConnection({
    type: 'sqlite',
    database,
    entities: DAFEntities,
    logging: false,
    dropSchema: true, // Isolate each test case
    synchronize: true
  })

  const secretKey = '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c'
  const secretBox = new SecretBox(secretKey)
  const keyManagementSystem = new KeyManagementSystem(new KeyStore(connection, secretBox))

  const identityProvider = new IdentityProvider({
    identityStore: new IdentityStore('rinkeby-ethr', connection),
    kms: keyManagementSystem,
    network: 'rinkeby',
    rpcUrl: 'https://rinkeby.infura.io/v3/5ffc47f65c4042ce847ef66a3fa70d4c'
  })

  const messageHandler = new JwtMessageHandler()
  messageHandler
    .setNext(new W3cMessageHandler())
    .setNext(new SdrMessageHandler())

  const actionHandler = new DIDCommActionHandler()
  actionHandler
    .setNext(new W3cActionHandler())
    .setNext(new SdrActionHandler())

  const agent = new Agent({
    identityProviders: [identityProvider],
    dbConnection: connection,
    didResolver: new DafResolver({ networks: [{ name: 'rinkeby', rpcUrl: 'https://rinkeby.infura.io/v3/5ffc47f65c4042ce847ef66a3fa70d4c' }] }),
    serviceControllers: [],
    messageHandler,
    actionHandler
  })

  return agent
}
