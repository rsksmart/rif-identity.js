import { Agent } from 'daf-core'
import { Server } from 'http'
import { configureStore, Store, AnyAction } from '@reduxjs/toolkit'
import { startGanacheServerAndDeployEthrDidRegistry } from '@rsksmart/ethr-did-utils/index'
import { createAgent, resetDatabase, deleteDatabase, startTestIssuerServer, importMnemonic, did2, did3 } from '../util'
import issueCredentialRequestReducer, { IssuedCredentialRequestsState } from '../../src/reducers/issuedCredentialRequests'
import { issueCredentialRequestFactory } from '../../src/operations/credentialRequests'

const database = 'rif-id-core.test.operations.issued-cred-reqs.sqlite'
const port = 5454
const issuerServerUrl = `http://localhost:${port}`

const mnemonic = 'venue harvest faith pole sketch crowd picture reform doll village mad pipe'

const claims = [
  { claimType: 'fullName', claimValue: 'David Ungar' },
  { claimType: 'almaMater', claimValue: 'U.C. Berkeley' }
]

describe('credential requests operations', () => {
  let ganacheServer: any
  let agent: Agent
  let store: Store<IssuedCredentialRequestsState, AnyAction>
  let issueCredentialRequest: ReturnType<typeof issueCredentialRequestFactory>
  let issuerServer: Server
  let did: string

  beforeAll(async () => {
    const startGanacheServerAndDeployEthrDidRegistryResult = await startGanacheServerAndDeployEthrDidRegistry()
    ganacheServer = startGanacheServerAndDeployEthrDidRegistryResult.server

    const rpcUrl = startGanacheServerAndDeployEthrDidRegistryResult.rpcUrl
    const registryAddress = startGanacheServerAndDeployEthrDidRegistryResult.registryAddress
    agent = await createAgent(database, { credentialRequestsFeature: true, rpcUrl, registryAddress })

    issueCredentialRequest = issueCredentialRequestFactory(agent)

    store = configureStore({ reducer: issueCredentialRequestReducer })

    issuerServer = startTestIssuerServer(port)
  })

  beforeEach(async () => {
    await importMnemonic(agent, mnemonic)
    const identity = await agent.identityManager.createIdentity()
    did = identity.did
  })

  afterEach(async () => {
    await resetDatabase(agent.dbConnection)
  })

  afterAll(() => {
    ganacheServer.close()
    deleteDatabase(agent, database)
    issuerServer.close()
  })

  describe('issue credential request', () => {
    test('success', async () => {
      const credentialRequest = await issueCredentialRequest(did, did2, claims, issuerServerUrl + '/request_credential')(store.dispatch)

      expect(credentialRequest.from).toBe(did)
      expect(credentialRequest.to).toBe(did2)
      expect(credentialRequest.claims[0]).toEqual(claims[0])
      expect(credentialRequest.claims[1]).toEqual(claims[1])
    })

    test('fails to sign jwt when identity does not exist', async () => {
      await expect(
        issueCredentialRequest(did3, did2, claims, issuerServerUrl + '/request_credential')(store.dispatch)
      ).rejects.toThrow('Identity not found')
    })

    test('fails to sign jwt when url is not set and receiver has no service endpoint', async () => {
      await expect(
        issueCredentialRequest(did, did2, claims)(store.dispatch)
      ).rejects.toThrow('Failed to send credential request')
    })
  })
})
