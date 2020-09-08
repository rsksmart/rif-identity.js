import { Agent } from 'daf-core'
import { configureStore, Store, AnyAction } from '@reduxjs/toolkit'
import { generateMnemonic } from '@rsksmart/rif-id-mnemonic'
import fs from 'fs'
import { createAgent, expectIsIdentity } from '../util'
import identitySlice, { selectIdentities, IdentityState } from '../../src/reducers/identitySlice'
import { initIdentityFactory, createIdentityFactory } from '../../src/operations/identity'

describe('identity operations', () => {
  let database: string
  let agent: Agent
  let store: Store<IdentityState, AnyAction>
  let mnemonic: string
  let initIdentity: ReturnType<typeof initIdentityFactory>
  let createIdentity: ReturnType<typeof createIdentityFactory>
  let preventClone = false

  beforeEach(async () => {
    mnemonic = generateMnemonic(12)
    database = `./rif-id-core-${Date.now()}.ops.identity.test.sqlite`
    agent = await createAgent(database, mnemonic)
    store = configureStore({ reducer: identitySlice })
    initIdentity = initIdentityFactory(agent)
    createIdentity = createIdentityFactory(agent)

    await initIdentity()(store.dispatch)
  })

  afterEach(async () => {
    if (!preventClone) await (await agent.dbConnection).close()
    fs.unlinkSync(database)
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
