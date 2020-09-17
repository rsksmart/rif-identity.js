import { Agent } from 'daf-core'
import { Server } from 'http'
import { configureStore, Store, AnyAction } from '@reduxjs/toolkit'
import { startGanacheServerAndDeployEthrDidRegistry } from '@rsksmart/ethr-did-utils/index'
import { createSqliteConnection, createAgent, resetDatabase, deleteDatabase, startTestIssuerServer, importMnemonic, did2, did3 } from '../util'
import issuedCredentialRequestReducer, { IssuedCredentialRequestsState } from '../../src/reducers/issuedCredentialRequests'
import { initCredentialRequestsFactory, issueCredentialRequestFactory, setIssuedCredentialRequestStatusFactory, deleteIssuedCredentialRequestFactory } from '../../src/operations/credentialRequests'
import { findCredentialRequests } from '../../src/entities'

const defaultIssuedCredentialRequestStatus = 'pending'

const database = `rif-id-core.test.operations.issued-cred-reqs.${+new Date()}.sqlite`
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
  let initCredentialRequests: ReturnType<typeof initCredentialRequestsFactory>
  let issueCredentialRequest: ReturnType<typeof issueCredentialRequestFactory>
  let setIssuedCredentialRequestStatus: ReturnType<typeof setIssuedCredentialRequestStatusFactory>
  let deleteIssuedCredentialRequest: ReturnType<typeof deleteIssuedCredentialRequestFactory>
  let issuerServer: Server
  let did: string

  beforeAll(async () => {
    const startGanacheServerAndDeployEthrDidRegistryResult = await startGanacheServerAndDeployEthrDidRegistry()
    ganacheServer = startGanacheServerAndDeployEthrDidRegistryResult.server

    const rpcUrl = startGanacheServerAndDeployEthrDidRegistryResult.rpcUrl
    const registryAddress = startGanacheServerAndDeployEthrDidRegistryResult.registryAddress
    agent = await createAgent(database, { credentialRequestsFeature: true, rpcUrl, registryAddress })

    initCredentialRequests = initCredentialRequestsFactory(agent)
    issueCredentialRequest = issueCredentialRequestFactory(agent)
    setIssuedCredentialRequestStatus = setIssuedCredentialRequestStatusFactory(agent)
    deleteIssuedCredentialRequest = deleteIssuedCredentialRequestFactory(agent)

    store = configureStore({ reducer: issuedCredentialRequestReducer })

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

  afterAll(async () => {
    await ganacheServer.close()
    await deleteDatabase(agent, database)
    issuerServer.close()
  })

  describe('issue credential request', () => {
    test('success', async () => {
      const credentialRequest = await issueCredentialRequest(did, did2, claims, defaultIssuedCredentialRequestStatus, issuerServerUrl + '/request_credential')(store.dispatch)

      expect(credentialRequest.from).toBe(did)
      expect(credentialRequest.to).toBe(did2)
      expect(credentialRequest.claims[0]).toEqual(claims[0])
      expect(credentialRequest.claims[1]).toEqual(claims[1])

      const state = store.getState()
      expect(Object.keys(state)).toEqual([did])

      const [credentialRequestState] = state[did]
      expect(credentialRequestState.from).toEqual(did)
      expect(credentialRequestState.to).toEqual(did2)
      expect(credentialRequestState.claims).toEqual(claims)
      expect(credentialRequestState.status).toEqual(defaultIssuedCredentialRequestStatus)
    })

    test('fails to sign jwt when identity does not exist', async () => {
      await expect(
        issueCredentialRequest(did3, did2, claims, defaultIssuedCredentialRequestStatus, issuerServerUrl + '/request_credential')(store.dispatch)
      ).rejects.toThrow('Identity not found')
    })

    test('fails to sign jwt when url is not set and receiver has no service endpoint', async () => {
      await expect(
        issueCredentialRequest(did, did2, claims, defaultIssuedCredentialRequestStatus)(store.dispatch)
      ).rejects.toThrow('Failed to send credential request')
    })
  })

  describe('set issued credential request status', () => {
    test('success', async () => {
      const credentialRequest = await issueCredentialRequest(did, did2, claims, defaultIssuedCredentialRequestStatus, issuerServerUrl + '/request_credential')(store.dispatch)
      await setIssuedCredentialRequestStatus(did, credentialRequest.id, 'received')(store.dispatch)

      const state = store.getState()
      expect(Object.keys(state)).toEqual([did])

      const [credentialRequestState] = state[did]
      expect(credentialRequestState.from).toEqual(did)
      expect(credentialRequestState.to).toEqual(did2)
      expect(credentialRequestState.claims).toEqual(claims)
      expect(credentialRequestState.status).toEqual('received')

      const foundCredentialRequest = await findCredentialRequests(await agent.dbConnection)

      expect(foundCredentialRequest[0].status).toEqual('received')
    })

    test('fails when credential request does not exists request', async () => {
      await expect(setIssuedCredentialRequestStatus(did, 'id2', 'received')(store.dispatch)).rejects.toThrow()
    })
  })

  describe('delete issued credential request', () => {
    test('success', async () => {
      const credentialRequest = await issueCredentialRequest(did, did2, claims, defaultIssuedCredentialRequestStatus, issuerServerUrl + '/request_credential')(store.dispatch)
      await deleteIssuedCredentialRequest(did, credentialRequest.id)(store.dispatch)

      expect(store.getState()).toEqual({})

      const foundCredentialRequest = await findCredentialRequests(await agent.dbConnection)

      expect(foundCredentialRequest).toHaveLength(0)
    })

    test('fails when credential request does not exists', async () => {
      await expect(deleteIssuedCredentialRequest(did, 'id2')(store.dispatch)).rejects.toThrow()
    })
  })

  describe('init issued credential request', () => {
    test('initial state', async () => {
      await initCredentialRequests()(store.dispatch)

      expect(store.getState()).toEqual({})
    })

    test('with issued credential request', async () => {
      await issueCredentialRequest(did, did2, claims, defaultIssuedCredentialRequestStatus, issuerServerUrl + '/request_credential')(store.dispatch)

      await (await agent.dbConnection).close()

      const dbConnection2 = createSqliteConnection(database, false, true)
      const agent2 = await createAgent(dbConnection2, { credentialRequestsFeature: true })
      const store2 = configureStore({ reducer: issuedCredentialRequestReducer })
      await initCredentialRequestsFactory(agent2)()(store2.dispatch)

      const state = store2.getState()
      expect(Object.keys(state)).toEqual([did])

      const [credentialRequestState] = state[did]
      expect(credentialRequestState.from).toEqual(did)
      expect(credentialRequestState.to).toEqual(did2)
      expect(credentialRequestState.claims).toEqual(claims)
      expect(credentialRequestState.status).toEqual('pending')

      await resetDatabase(dbConnection2)
    })
  })
})
