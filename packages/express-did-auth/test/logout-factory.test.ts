import { logoutFactory } from '../src/factories/logout-factory'
import { getMockedAppState, mockedResFactory } from './utils'

describe('logoutFactory', () => {
  const did = 'did:ethr:rsk:testnet:0xd69ced736454347be68aead53fcc1678cb9a70ef'

  test('should respond with a 200 and delete logged out did and refreshToken from state', () => {
    const res = mockedResFactory(200)
    const req = { user: { did } }

    const { state, refreshToken } = getMockedAppState(did)

    expect(state.sessions[did]).toBeTruthy()
    expect(state.refreshTokens[refreshToken]).toBeTruthy()

    logoutFactory(state)(req, res)

    expect(state.sessions[did]).toBeFalsy()
    expect(state.refreshTokens[refreshToken]).toBeFalsy()
  })

  test('should respond with a 200 even if the state is empty', () => {
    const res = mockedResFactory(200)
    const req = { user: { did } }

    const { state } = getMockedAppState()

    logoutFactory(state)(req, res)
  })

  test('should respond with a 200 even if the did present in req is not present in the state', () => {
    const anotherDid = 'did:ethr:rsk:testnet:0x123456789'

    const res = mockedResFactory(200)
    const req = { user: { did: anotherDid } }

    const { state } = getMockedAppState()

    logoutFactory(state)(req, res)
  })
})
