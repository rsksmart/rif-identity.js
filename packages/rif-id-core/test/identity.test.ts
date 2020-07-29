import { Agent } from 'daf-core'
import thunk from 'redux-thunk'
import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import { generateMnemonic } from '@rsksmart/rif-id-mnemonic'
import reducer from '@rsksmart/rif-id-core-reducer'
import { getIdentity } from '@rsksmart/rif-id-core-reducer/lib/identityReducer'
import { createIdentity } from '../src/identity'
import { setupAgent } from './setupAgent'

const mockStore = () => configureStore({
  reducer,
  middleware: [...getDefaultMiddleware(), thunk]
})

describe('identity', function (this: { agent: Agent }) {
  beforeEach(() => {
    this.agent = setupAgent('rif-id-core.identity.test.sqlite')
  })

  afterEach(async () => {
    await (await this.agent.dbConnection).close()
  })

  test('create identity', async () => {
    const store = mockStore()

    const mnemonic = generateMnemonic(12)
    await createIdentity(this.agent)(mnemonic)(store.dispatch)
    const did = getIdentity(store.getState().identity)

    expect(did.slice(0, 15)).toEqual('did:ethr:rsk:0x')
    expect(did.slice(15)).toHaveLength(40)

    // TODO: add test with vector

    expect(createIdentity(this.agent)(mnemonic)(store.dispatch)).rejects.toThrow()
  })
})
