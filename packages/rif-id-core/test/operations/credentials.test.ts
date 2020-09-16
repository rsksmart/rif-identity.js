import { AbstractIdentity, Agent, Credential as DafCredential } from 'daf-core'
import credentialReducer, { CredentialsState, Credential } from '../../src/reducers/credentials'
import { Store, AnyAction, configureStore } from '@reduxjs/toolkit'
import { deleteCredentialFactory, initCredentialsFactory, receiveCredentialFactory } from '../../src/operations/credentials'
import { createAgent, deleteDatabase, generateCredential } from '../util'
import { generateMnemonic } from '@rsksmart/rif-id-mnemonic'

const assertCompareCredentialValues = (actual: Credential, expected: DafCredential) => {
  expect(actual).toBeTruthy()

  expect(actual.subject).toEqual(expected.subject.did)
  expect(actual.issuer).toEqual(expected.issuer.did)
  expect(actual.issuanceDate).toEqual(expected.issuanceDate.getTime())
  expect(actual.expirationDate).toEqual(expected.expirationDate?.getTime())
  expect(actual.credentialSubject).toEqual(expected.credentialSubject)
  expect(actual.hash).toEqual(expected.hash)
  expect(actual.raw).toEqual(expected.raw)
  expect(actual.type).toEqual(expected.type)
  expect(actual.context).toEqual(expected.context)
}

const findCredentialsOrderedByIssuanceDate = async (
  agent: Agent
) => (await agent.dbConnection).getRepository(DafCredential).find({ order: { issuanceDate: 'ASC' } })

describe('credentials operations', () => {
  let agent: Agent
  let database: string
  let store: Store<CredentialsState, AnyAction>
  let deleteCredential: ReturnType<typeof deleteCredentialFactory>
  let receiveCredential: ReturnType<typeof receiveCredentialFactory>

  beforeEach(async () => {
    const mnemonic = generateMnemonic(12)
    database = `test.rif-id-core.operations.credentials.holder.${new Date().getTime()}.sqlite`
    agent = await createAgent(database, { mnemonic })
    store = configureStore({ reducer: credentialReducer })
    receiveCredential = receiveCredentialFactory(agent)
    deleteCredential = deleteCredentialFactory(agent)
  })

  describe('no credential', () => {
    afterEach(() => deleteDatabase(agent, database))

    test('initialize', async () => {
      await initCredentialsFactory(agent)()(store.dispatch)

      expect(store.getState()).toEqual({})
    })

    test('delete when empty db should throw an error', async () => {
      try {
        await deleteCredential('no exists', 'no exists')(store.dispatch)
      } catch (err) {
        expect(err.message).toBeTruthy()
      }
    })
  })

  describe('single credential', () => {
    let vc: DafCredential, identity: AbstractIdentity

    beforeEach(async () => {
      identity = await agent.identityManager.createIdentity()
      vc = await generateCredential(identity.did)

      await receiveCredential(vc.raw)(store.dispatch)
    })

    test('initialize', async () => {
      await (await agent.dbConnection).close() // close the db to start a new agent

      const agent2 = await createAgent(database, {})
      const store2 = configureStore({ reducer: credentialReducer })

      await initCredentialsFactory(agent2)()(store2.dispatch)

      const state = store2.getState()

      expect(state).toBeTruthy()

      expect(Object.keys(state)).toEqual([identity.did])
      expect(state[identity.did]).toHaveLength(1)

      const credential: Credential = state[identity.did][0]

      assertCompareCredentialValues(credential, vc)

      return deleteDatabase(agent2, database)
    })

    test('receive', async () => {
      // check reducer
      const state = store.getState()

      expect(state).toBeTruthy()
      expect(Object.keys(state)).toEqual([identity.did])

      const credential: Credential = state[identity.did][0]
      assertCompareCredentialValues(credential, vc)

      // check db
      const credentials = await findCredentialsOrderedByIssuanceDate(agent)
      expect(credentials).toHaveLength(1)
      assertCompareCredentialValues(credential, credentials[0])

      return deleteDatabase(agent, database)
    })

    test('delete', async () => {
      await deleteCredential(vc.subject.did, vc.hash)(store.dispatch)

      // check reducer
      expect(store.getState()).toEqual({})

      // check db
      const credentials = await findCredentialsOrderedByIssuanceDate(agent)
      expect(credentials).toHaveLength(0)

      return deleteDatabase(agent, database)
    })
  })

  describe('many credentials with many identities', () => {
    let vc1Id1: DafCredential, vc1Id2: DafCredential, vc2Id1: DafCredential
    let identity1: AbstractIdentity, identity2: AbstractIdentity

    beforeEach(async () => {
      identity1 = await agent.identityManager.createIdentity()
      identity2 = await agent.identityManager.createIdentity()

      expect(identity1).not.toEqual(identity2)

      vc1Id1 = await generateCredential(identity1.did)
      vc2Id1 = await generateCredential(identity1.did)
      vc1Id2 = await generateCredential(identity2.did)

      expect(vc1Id1).not.toEqual(vc1Id2)
      expect(vc1Id2).not.toEqual(vc2Id1)
      expect(vc1Id1).not.toEqual(vc2Id1)

      await receiveCredential(vc1Id1.raw)(store.dispatch)
      await receiveCredential(vc2Id1.raw)(store.dispatch)
      await receiveCredential(vc1Id2.raw)(store.dispatch)
    })

    test('initialize', async () => {
      await (await agent.dbConnection).close() // close the db to start a new agent

      const agent2 = await createAgent(database, {})
      const store2 = configureStore({ reducer: credentialReducer })

      await initCredentialsFactory(agent2)()(store2.dispatch)

      const state = store2.getState()

      expect(state).toBeTruthy()

      expect(Object.keys(state)).toEqual([identity1.did, identity2.did])
      expect(state[identity1.did]).toHaveLength(2)
      expect(state[identity2.did]).toHaveLength(1)

      return deleteDatabase(agent2, database)
    })

    test('receive', async () => {
      // check reducer
      const state = store.getState()

      expect(state[identity1.did]).toHaveLength(2)
      expect(state[identity2.did]).toHaveLength(1)

      const cred1id1: Credential = state[identity1.did][0]
      assertCompareCredentialValues(cred1id1, vc1Id1)

      const cred2id1: Credential = state[identity1.did][1]
      assertCompareCredentialValues(cred2id1, vc2Id1)

      const cred1id2: Credential = state[identity2.did][0]
      assertCompareCredentialValues(cred1id2, vc1Id2)

      // check db
      const credentials = await findCredentialsOrderedByIssuanceDate(agent)
      expect(credentials).toHaveLength(3)

      assertCompareCredentialValues(cred1id1, credentials[0])
      assertCompareCredentialValues(cred2id1, credentials[1])
      assertCompareCredentialValues(cred1id2, credentials[2])

      return deleteDatabase(agent, database)
    })

    test('delete just one credential', async () => {
      await deleteCredential(vc1Id1.subject.did, vc1Id1.hash)(store.dispatch)

      // check reducer
      const state = store.getState()
      expect(state[vc2Id1.subject.did]).toHaveLength(1)
      expect(state[vc1Id2.subject.did]).toHaveLength(1)

      // check db
      const credentials = await findCredentialsOrderedByIssuanceDate(agent)
      expect(credentials).toHaveLength(2)

      return deleteDatabase(agent, database)
    })

    test('delete all', async () => {
      await deleteCredential(vc1Id1.subject.did, vc1Id1.hash)(store.dispatch)
      await deleteCredential(vc2Id1.subject.did, vc2Id1.hash)(store.dispatch)
      await deleteCredential(vc1Id2.subject.did, vc1Id2.hash)(store.dispatch)

      // check reducer
      const state = store.getState()
      expect(state).toEqual({})

      // check db
      const credentials = await findCredentialsOrderedByIssuanceDate(agent)
      expect(credentials).toHaveLength(0)

      return deleteDatabase(agent, database)
    })
  })
})
