import { Agent } from 'daf-core'
import { configureStore, Store, AnyAction } from '@reduxjs/toolkit'
import fs from 'fs'
import { createAgent, deleteDatabase, did, did2 } from '../util'
import declarativeDetailsReducer, {
  joinDeclarativeDetails,
  DeclarativeDetailsState,
  DeclarativeDetails
} from '../../src/reducers/declarativeDetails'
import { setDeclarativeDetailsFactory, initDeclarativeDetailsFactory } from '../../src/operations/declarativeDetails'
import { DeclarativeDetail } from '../../src/entities/DeclarativeDetail'

const fullNameDL: DeclarativeDetails = { fullName: { type: 'string', value: 'Donald Knuth' } }
const cityDL: DeclarativeDetails = { city: { type: 'string', value: 'Wisconsin' } }
const dobDL: DeclarativeDetails = { dateOfBirth: { type: 'timestamp', value: '-1009065600' } }
const newDobDL = { dateOfBirth: { type: 'timestamp', value: '-1009069999' } }

function assertCompareDeclarativeDetail(entity: DeclarativeDetail, { did, name, type, value }: { did: string, name: string, type: string, value: string }) {
  expect(entity.did).toEqual(did)
  expect(entity.name).toEqual(name)
  expect(entity.type).toEqual(type)
  expect(entity.value).toEqual(value)
}

const findDeclarativeDetailsAndOrderByName = async (agent: Agent) => {
  const entities: DeclarativeDetail[] = await (await agent.dbConnection).getRepository(DeclarativeDetail)
    .find({ order: { name: 'ASC' }})
  return entities
}

describe('declarative details operations', () => {
  let agent: Agent
  let database: string
  let store: Store<DeclarativeDetailsState, AnyAction>
  let setDeclarativeDetails: ReturnType<typeof setDeclarativeDetailsFactory>
  let initDeclarativeDetails: ReturnType<typeof initDeclarativeDetailsFactory>

  const setDeclarativeDetailsAndAssert = (did: string, declarativeDetails: DeclarativeDetails) => setDeclarativeDetails(did, declarativeDetails)(store.dispatch)
    .then(success => expect(success).toBeTruthy())

  beforeEach(async () => {
    database = `test.rif-id-core.operations.declarativeDetails.${new Date()}.sqlite`
    agent = await createAgent(database, { declarativeDetailsFeature: true })
    store = configureStore({ reducer: declarativeDetailsReducer })
    setDeclarativeDetails = setDeclarativeDetailsFactory(agent)
    initDeclarativeDetails = initDeclarativeDetailsFactory(agent)
  })

  describe('crud declarative details', () => {
    afterEach(() => deleteDatabase(agent, database))

    test('create and read', async () => {
      const declarativeDetails = joinDeclarativeDetails(fullNameDL)
      await setDeclarativeDetailsAndAssert(did, declarativeDetails)

      // test store state
      const expectedState = {}
      expectedState[did] = declarativeDetails

      expect(store.getState()).toEqual(expectedState)

      // test db state
      const entities = await findDeclarativeDetailsAndOrderByName(agent)

      expect(entities).toHaveLength(1)

      const [entity] = entities

      assertCompareDeclarativeDetail(entity, {
        did, name: 'fullName', type: 'string', value: 'Donald Knuth'
      })
    })

    describe('create many and read', () => {
      test('together', async () => {
        await setDeclarativeDetailsAndAssert(did, joinDeclarativeDetails(fullNameDL, cityDL, dobDL))
      })

      test('one by one', async () => {
        await setDeclarativeDetailsAndAssert(did, fullNameDL)
        await setDeclarativeDetailsAndAssert(did, cityDL)
        await setDeclarativeDetailsAndAssert(did, dobDL)
      })

      test('mixed', async () => {
        await setDeclarativeDetailsAndAssert(did, joinDeclarativeDetails(fullNameDL, cityDL))
        await setDeclarativeDetailsAndAssert(did, dobDL)
      })

      afterEach(async () => {
        const expectedDeclarativeDetails = joinDeclarativeDetails(fullNameDL, cityDL, dobDL)

        // test store state
        const expectedState = {}
        expectedState[did] = expectedDeclarativeDetails

        expect(store.getState()).toEqual(expectedState)

        // test db state
        const entities = await findDeclarativeDetailsAndOrderByName(agent)

        expect(entities).toHaveLength(3)

        const [cityEntity, dobEntity, fullNameEntity] = entities

        assertCompareDeclarativeDetail(cityEntity, { did, name: 'city', type: 'string', value: 'Wisconsin' })
        assertCompareDeclarativeDetail(dobEntity, { did, name: 'dateOfBirth', type: 'timestamp', value: '-1009065600' })
        assertCompareDeclarativeDetail(fullNameEntity, { did, name: 'fullName', type: 'string', value: 'Donald Knuth' })
      })
    })

    describe('update', () => {
      test('create, update, then read', async () => {
        await setDeclarativeDetailsAndAssert(did, joinDeclarativeDetails(fullNameDL, cityDL, dobDL))
        await setDeclarativeDetailsAndAssert(did, newDobDL)

      })

      test('create and update at the same time, then read', async () => {
        await setDeclarativeDetailsAndAssert(did, joinDeclarativeDetails(fullNameDL, dobDL))
        await setDeclarativeDetailsAndAssert(did, joinDeclarativeDetails(cityDL, newDobDL))
      })

      afterEach(async () => {
        // test store state
        const expectedState = {}
        expectedState[did] = joinDeclarativeDetails(fullNameDL, cityDL, newDobDL)

        expect(store.getState()).toEqual(expectedState)

        // test db state
        const entities = await findDeclarativeDetailsAndOrderByName(agent)


        expect(entities).toHaveLength(3)

        const [cityEntity, dobEntity, fullNameEntity] = entities

        assertCompareDeclarativeDetail(cityEntity, { did, name: 'city', type: 'string', value: 'Wisconsin' })
        assertCompareDeclarativeDetail(fullNameEntity, { did, name: 'fullName', type: 'string', value: 'Donald Knuth' })
        assertCompareDeclarativeDetail(dobEntity, { did, name: 'dateOfBirth', type: 'timestamp', value: '-1009069999' })
      })
    })

    describe('delete', () => {
      beforeEach(async () => {
        // add 3
        await setDeclarativeDetailsAndAssert(did, joinDeclarativeDetails(fullNameDL, cityDL, dobDL))
      })

      // delete 2
      test('delete one by one', async () => {
        await setDeclarativeDetailsAndAssert(did, { fullName: undefined })
        await setDeclarativeDetailsAndAssert(did, { city: undefined })
      })

      test('delete many', async () => {
        await setDeclarativeDetailsAndAssert(did, joinDeclarativeDetails({ fullName: undefined }, { city: undefined }))
      })

      afterEach(async () => {
        // test store state
        const expectedState = {}
        expectedState[did] = dobDL

        expect(store.getState()).toEqual(expectedState)

        // test db state
        const entities = await findDeclarativeDetailsAndOrderByName(agent)

        expect(entities).toHaveLength(1)

        const [dobEntity] = entities

        assertCompareDeclarativeDetail(dobEntity, { did, name: 'dateOfBirth', type: 'timestamp', value: '-1009065600' })
      })
    })

    test('mixed operations', async () => {
      // add full name and date of birth
      await setDeclarativeDetailsAndAssert(did, joinDeclarativeDetails(fullNameDL, dobDL))

      // delete full name, update date fo birth and add city
      await setDeclarativeDetailsAndAssert(did, joinDeclarativeDetails({ fullName: undefined }, newDobDL, cityDL))

      // test store state
      const expectedState = {}
      expectedState[did] = joinDeclarativeDetails(newDobDL, cityDL)

      expect(store.getState()).toEqual(expectedState)

      // test db state
      const entities = await findDeclarativeDetailsAndOrderByName(agent)

      expect(entities).toHaveLength(2)

      const [cityEntity, dobEntity] = entities

      assertCompareDeclarativeDetail(cityEntity, { did, name: 'city', type: 'string', value: 'Wisconsin' })
      assertCompareDeclarativeDetail(dobEntity, { did, name: 'dateOfBirth', type: 'timestamp', value: '-1009069999' })
    })
  })

  describe('initialize declarative details', () => {
    test('empty', async () => {
      await initDeclarativeDetails()(store.dispatch)

      expect(store.getState()).toEqual({})

      await deleteDatabase(agent, database)
    })

    test('one did one entity', async () => {
      // add a declarative detail and close connection
      const declarativeDetails = joinDeclarativeDetails(fullNameDL)
      await setDeclarativeDetailsAndAssert(did, declarativeDetails)
      await (await agent.dbConnection).close()

      // restore connection
      const agent2 = await createAgent(database, { declarativeDetailsFeature: true })
      const store2 = configureStore({ reducer: declarativeDetailsReducer })

      await initDeclarativeDetailsFactory(agent2)()(store2.dispatch)

      let expectedState: DeclarativeDetailsState = {}
      expectedState[did] = fullNameDL

      expect(store2.getState()).toEqual(expectedState)

      await deleteDatabase(agent2, database)
    })

    test('one did many entities', async () => {
      const declarativeDetails = joinDeclarativeDetails(fullNameDL, cityDL)
      await setDeclarativeDetailsAndAssert(did, declarativeDetails)
      await (await agent.dbConnection).close()

      const agent2 = await createAgent(database, { declarativeDetailsFeature: true })
      const store2 = configureStore({ reducer: declarativeDetailsReducer })

      await initDeclarativeDetailsFactory(agent2)()(store2.dispatch)

      let expectedState: DeclarativeDetailsState = {}
      expectedState[did] = declarativeDetails

      expect(store2.getState()).toEqual(expectedState)

      await deleteDatabase(agent2, database)
    })

    test('many dids', async () => {
      // add a declarative detail and close connection
      await setDeclarativeDetailsAndAssert(did, fullNameDL)
      await setDeclarativeDetailsAndAssert(did2, cityDL)
      await (await agent.dbConnection).close()

      // restore connection
      const agent2 = await createAgent(database, { declarativeDetailsFeature: true })
      const store2 = configureStore({ reducer: declarativeDetailsReducer })

      await initDeclarativeDetailsFactory(agent2)()(store2.dispatch)

      let expectedState: DeclarativeDetailsState = {}
      expectedState[did] = fullNameDL
      expectedState[did2] = cityDL

      expect(store.getState()).toEqual(expectedState)

      await deleteDatabase(agent2, database)
    })
  })
})
