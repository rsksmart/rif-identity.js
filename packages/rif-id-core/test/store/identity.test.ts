import { configureIdentityStore } from '../../src/store/identity'

describe('identity store', () => {
  test('creates store', () => {
    const store = configureIdentityStore({ reducer: {} })
  })
})
