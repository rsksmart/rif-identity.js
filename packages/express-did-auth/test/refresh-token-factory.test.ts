import { refreshTokenFactory } from '../src/factories/refresh-token-factory'
import { INVALID_OR_EXPIRED_SESSION, NO_REFRESH_TOKEN } from '../src/errors'
import { getMockedAppState, Identity, identityFactory, mockedResFactory, MockedResponse } from './utils'
import { AuthenticationConfig } from '../src/types'

describe('RefreshTokenFactory', () => {
  const serviceUrl = 'https://service.com'

  let accessTokenConfig: AuthenticationConfig
  let userIdentity: Identity

  beforeAll(async () => {
    const serviceIdentity = await identityFactory()
    accessTokenConfig = {
      serviceDid: serviceIdentity.did,
      serviceSigner: serviceIdentity.signer,
      serviceUrl
    }

    userIdentity = await identityFactory()
  })

  test('should respond with 401 if no refresh token', async () => {
    const req = { body: { } }
    const res = mockedResFactory(401, NO_REFRESH_TOKEN)
    const { state } = getMockedAppState()

    await refreshTokenFactory(state, accessTokenConfig)(req, res)
  })

  test('should respond with 401 if invalid refresh token', async () => {
    const req = { body: { refreshToken: 'invalid' } }
    const res = mockedResFactory(401, INVALID_OR_EXPIRED_SESSION)
    const { state } = getMockedAppState()

    await refreshTokenFactory(state, accessTokenConfig)(req, res)
  })

  describe('no cookies', () => {
    test('should refresh if valid existing session', async () => {
      const { state, refreshToken } = getMockedAppState(userIdentity.did)

      const req = { body: { refreshToken } }
      const expectedAssertion = (response: MockedResponse) => {
        // eslint-disable-next-line dot-notation
        expect(response['accessToken']).toBeTruthy()
        // eslint-disable-next-line dot-notation
        expect(response['refreshToken']).toBeTruthy()
      }
      const res = mockedResFactory(200, undefined, expectedAssertion)

      await refreshTokenFactory(state, accessTokenConfig)(req, res)
    })
  })
})
