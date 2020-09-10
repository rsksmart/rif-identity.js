import { Agent } from 'daf-core'
import { configureStore, Store, AnyAction } from '@reduxjs/toolkit'
import { createAgent, deleteDatabase, did } from '../util'
import declarativeDetailsReducer, { findDeclarativeDetailsMatchingNames, DeclarativeDetailsState, DeclarativeDetails } from '../../src/reducers/declarativeDetails'
import { setDeclarativeDetailsFactory } from '../../src/operations/declarativeDetails'
import { BeforeUpdate } from 'typeorm'
import { DeclarativeDetail } from '../../src/entities/DeclarativeDetail'

const fullNameDL: DeclarativeDetails = { fullName: { type: 'string', value: 'Donald Knuth' } }
const cityDL: DeclarativeDetails = { city: { type: 'string', value: 'Wisconsin' } }
const dobDL: DeclarativeDetails = { dateOfBirth: { type: 'timestamp', value: '-1009065600' } }

describe('declarative details operations', () => {
  let agent: Agent
  let database: string
  let store: Store<DeclarativeDetailsState, AnyAction>
  let setDeclarativeDetails: ReturnType<typeof setDeclarativeDetailsFactory>

  beforeEach(async () => {
    database = `test.rif-id-core.operations.declarativeDetails.${new Date()}.sqlite`
    agent = await createAgent(database, { declarativeDetailsFeature: true })
    store = configureStore({ reducer: declarativeDetailsReducer })
    setDeclarativeDetails = setDeclarativeDetailsFactory(agent)
  })

  afterEach(() => deleteDatabase(agent, database))

  describe('crud declarative details', () => {
    test('create', async () => {})

    test('create many', async () => {})

    test('read', async () => {})

    test('update', async () => {})

    test('delete', async () => {})

    test('mixed operations', async () => {})
  })

  describe('initialize declarative details', () => {
    test('recovers created declarative details', async () => {})
  })
})
