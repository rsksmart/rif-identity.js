import { Agent } from 'daf-core'
import { configureStore, Store, AnyAction } from '@reduxjs/toolkit'
import { generateMnemonic } from '@rsksmart/rif-id-mnemonic'
import fs from 'fs'
import { createAgent, expectIsIdentity } from '../util'
import identitySlice, { selectIdentities, IdentityState } from '../../src/reducers/identitySlice'
import { initIdentityFactory, createIdentityFactory, deleteIdentityFactory } from '../../src/operations/identity'

const mockCallbackFactory = () => jest.fn((err, res) => {
  if (err) return err
  else return res
})

describe('identity operations', () => {
  let database: string
  let agent: Agent
  let store: Store<IdentityState, AnyAction>
  let mnemonic: string
  let initIdentity: ReturnType<typeof initIdentityFactory>
  let createIdentity: ReturnType<typeof createIdentityFactory>
  let deleteIdentity: ReturnType<typeof deleteIdentityFactory>
  let preventClone = false

  beforeEach(async () => {
    database = `./rif-id-core-${Date.now()}.ops.identity.test.sqlite`
  })

  afterEach(async () => {
    if (!preventClone) await (await agent.dbConnection).close()
    if (fs.existsSync(database)) fs.unlinkSync(database)
  })

  describe('init with callback', () => {
    let mockCallback

    beforeEach(() => {
      mockCallback = mockCallbackFactory()
    })

    test('success', async () => {
      mnemonic = generateMnemonic(12)
      agent = await createAgent(database, mnemonic)
      store = configureStore({ reducer: identitySlice })
      initIdentity = initIdentityFactory(agent)
      createIdentity = createIdentityFactory(agent)

      await initIdentity(mockCallback)(store.dispatch)

      expect(mockCallback.mock.calls.length).toBe(1)
      expect(mockCallback.mock.calls[0][0]).toBeUndefined()
      expect(mockCallback.mock.calls[0][1]).toEqual([])
      expect(mockCallback.mock.results[0].value).toEqual([])
    })

    test('error', async () => {
      agent = await createAgent(database)
      store = configureStore({ reducer: identitySlice })
      initIdentity = initIdentityFactory(agent)
      createIdentity = createIdentityFactory(agent)

      // trigger an error in the promise
      await (await agent.dbConnection).dropDatabase()

      await initIdentity(mockCallback)(store.dispatch)

      expect(mockCallback.mock.calls.length).toBe(1)
      expect(mockCallback.mock.calls[0][0]).toBeInstanceOf(Error)
      expect(mockCallback.mock.calls[0][1]).toBeUndefined()
      expect(mockCallback.mock.results[0].value).toBeInstanceOf(Error)
    })
  })

  describe('after init', () => {
    beforeEach(async () => {
      mnemonic = generateMnemonic(12)
      database = `./rif-id-core-${Date.now()}.ops.identity.test.sqlite`
      agent = await createAgent(database, mnemonic)
      store = configureStore({ reducer: identitySlice })
      initIdentity = initIdentityFactory(agent)
      createIdentity = createIdentityFactory(agent)

      await initIdentity()(store.dispatch)
    })

    test('initially has no identities', async () => {
      const identities = selectIdentities(store.getState())

      expect(identities).toEqual([])
    })

    test('create identity', async () => {
      await createIdentity()(store.dispatch)

      const identities = selectIdentities(store.getState())

      expect(identities).toHaveLength(1)

      expectIsIdentity(identities[0])
    })

    test('create two identities', async () => {
      await createIdentity()(store.dispatch)
      await createIdentity()(store.dispatch)

      const identities = selectIdentities(store.getState())

      expect(identities).toHaveLength(2)

      expectIsIdentity(identities[0])
      expectIsIdentity(identities[1])
    })

    test('restores identities', async () => {
      preventClone = true

      await createIdentity()(store.dispatch)
      await createIdentity()(store.dispatch)

      await (await agent.dbConnection).close()

      const agent2 = await createAgent(database) // same database
      const store2 = configureStore({ reducer: identitySlice })
      const initIdentity2 = initIdentityFactory(agent2)

      await initIdentity2()(store2.dispatch)

      const identities = selectIdentities(store2.getState())

      expect(identities).toHaveLength(2)

      expectIsIdentity(identities[0])
      expectIsIdentity(identities[1])

      await (await agent2.dbConnection).close()
    })
  })

  describe('crate identity callback', () => {
    let mockCallback

    beforeEach(() => {
      mockCallback = mockCallbackFactory()
    })

    test('success', async () => {
      mnemonic = generateMnemonic(12)
      agent = await createAgent(database, mnemonic)
      store = configureStore({ reducer: identitySlice })
      initIdentity = initIdentityFactory(agent)
      createIdentity = createIdentityFactory(agent)

      await initIdentity()(store.dispatch)

      await createIdentity(mockCallback)(store.dispatch)

      expect(mockCallback.mock.calls.length).toBe(1)
      expect(mockCallback.mock.calls[0][0]).toBeUndefined()
      expectIsIdentity(mockCallback.mock.calls[0][1].did)
      expectIsIdentity(mockCallback.mock.results[0].value.did)

      const identities = selectIdentities(store.getState())

      expect(identities).toHaveLength(1)

      expectIsIdentity(identities[0])
    })

    test('error', async () => {
      agent = await createAgent(database)

      store = configureStore({ reducer: identitySlice })
      initIdentity = initIdentityFactory(agent)
      createIdentity = createIdentityFactory(agent)

      await initIdentity()(store.dispatch)

      await createIdentity(mockCallback)(store.dispatch)

      expect(mockCallback.mock.calls.length).toBe(1)
      expect(mockCallback.mock.calls[0][0]).toBeInstanceOf(Error)
      expect(mockCallback.mock.calls[0][1]).toBeUndefined()
      expect(mockCallback.mock.results[0].value).toBeInstanceOf(Error)

      const identities = selectIdentities(store.getState())

      expect(identities).toHaveLength(0)
    })
  })

  describe('delete identity', () => {
    let identityProviderType: string

    beforeEach(async () => {
      mnemonic = generateMnemonic(12)
      database = `./rif-id-core-${Date.now()}.ops.identity.test.sqlite`
      agent = await createAgent(database, mnemonic)
      store = configureStore({ reducer: identitySlice })
      initIdentity = initIdentityFactory(agent)
      createIdentity = createIdentityFactory(agent)
      deleteIdentity = deleteIdentityFactory(agent)

      await initIdentity()(store.dispatch)

      // it is ${netowork}-${type}
      identityProviderType = agent.identityManager.getIdentityProviders()[0].type
    })
    
    test('should not allow to delete non existent identity', async () => {
      await deleteIdentity(identityProviderType, 'did:ethr:rsk:0xd8c84e8bb1932f095044f2aab1e2d028c582fb6b')(store.dispatch).catch(e => {
        expect(e.message).toBe('Identity not found')
      })
    })

    test('should not allow to delete non existent identity with callback', async () => {
      const mockCallback = mockCallbackFactory()

      await deleteIdentity(identityProviderType, 'did:ethr:rsk:0xd8c84e8bb1932f095044f2aab1e2d028c582fb6b', mockCallback)(store.dispatch)

      expect(mockCallback.mock.calls.length).toBe(1)
      expect(mockCallback.mock.calls[0][0]).toBeInstanceOf(Error)
      expect(mockCallback.mock.calls[0][1]).toBeUndefined()
      expect(mockCallback.mock.results[0].value).toBeInstanceOf(Error)
    })

    test('should allow to delete an identity', async () => {
      await initIdentity()(store.dispatch)
      const identity = await createIdentity()(store.dispatch)

      await deleteIdentity(identityProviderType, identity.did)(store.dispatch)

      expect(await agent.identityManager.getIdentities()).toHaveLength(0)
      expect(store.getState().identities).toHaveLength(0)
    })

    test('should allow to delete an identity with callback', async () => {
      const mockCallback = mockCallbackFactory()

      await initIdentity()(store.dispatch)
      const identity = await createIdentity()(store.dispatch)

      await deleteIdentity(identityProviderType, identity.did, mockCallback)(store.dispatch)

      expect(mockCallback.mock.calls.length).toBe(1)
      expect(mockCallback.mock.calls[0][0]).toBeUndefined()
      expect(mockCallback.mock.calls[0][1]).toBeTruthy()
      expect(mockCallback.mock.results[0].value).toBeTruthy()

      expect(await agent.identityManager.getIdentities()).toHaveLength(0)
      expect(store.getState().identities).toHaveLength(0)
    })
  })
})
