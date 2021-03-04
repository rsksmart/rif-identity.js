import { TokenValidationConfig } from '../src'
import { ACCESS_TOKEN_COOKIE_NAME, COOKIES_ATTRIBUTES, REFRESH_TOKEN_COOKIE_NAME } from '../src/constants'
import { logoutFactory } from '../src/factories/logout-factory'
import { getMockedAppState, mockedResFactory } from './utils'
import MockDate from 'mockdate'

describe('logoutFactory', () => {
  const did = 'did:ethr:rsk:testnet:0xd69ced736454347be68aead53fcc1678cb9a70ef'
  const fakeConfig: TokenValidationConfig = { serviceUrl: 'this.is.atest.com', serviceDid: 'did:ethr:rsk:0xabcd1234' }

  test('should respond with a 200 and delete logged out did and refreshToken from state', () => {
    const res = mockedResFactory(200)
    const req = { user: { did } }

    const { state, refreshToken } = getMockedAppState(did)

    expect(state.sessions[did]).toBeTruthy()
    expect(state.refreshTokens[refreshToken]).toBeTruthy()

    logoutFactory(state, fakeConfig)(req, res)

    expect(state.sessions[did]).toBeFalsy()
    expect(state.refreshTokens[refreshToken]).toBeFalsy()
  })

  test('should respond with a 200 even if the state is empty', () => {
    const res = mockedResFactory(200)
    const req = { user: { did } }

    const { state } = getMockedAppState()

    logoutFactory(state, fakeConfig)(req, res)
  })

  test('should respond with a 200 even if the did present in req is not present in the state', () => {
    const anotherDid = 'did:ethr:rsk:testnet:0x123456789'

    const res = mockedResFactory(200)
    const req = { user: { did: anotherDid } }

    const { state } = getMockedAppState()

    logoutFactory(state, fakeConfig)(req, res)
  })

  test('should set an empty cookie with expiration time', () => {
    const res = mockedResFactory(200)
    const req = { user: { did } }

    const mockedDate = Date.now()
    MockDate.set(mockedDate)
    const expectedCookieExpiration = new Date(mockedDate + 1000)

    const { state, refreshToken } = getMockedAppState(did)

    expect(state.sessions[did]).toBeTruthy()
    expect(state.refreshTokens[refreshToken]).toBeTruthy()

    logoutFactory(state, { ...fakeConfig, useCookies: true })(req, res)

    expect(state.sessions[did]).toBeFalsy()
    expect(state.refreshTokens[refreshToken]).toBeFalsy()
    expect(res.cookie).toHaveBeenCalledTimes(2)
    expect(res.cookie).toHaveBeenCalledWith(`${ACCESS_TOKEN_COOKIE_NAME}-${did}`, '', { ...COOKIES_ATTRIBUTES, expires: expectedCookieExpiration, sameSite: 'none' })
    expect(res.cookie).toHaveBeenCalledWith(`${REFRESH_TOKEN_COOKIE_NAME}-${did}`, '', { ...COOKIES_ATTRIBUTES, expires: expectedCookieExpiration, sameSite: 'none' })
  })
})
