import SessionManager from '../src/classes/session-manager'
import refreshTokenFactory from '../src/factories/refresh-token-factory'
import { ErrorCodes } from '../src/errors'
import { Identity, identityFactory, mockedResFactory, MockedResponse } from './utils'
import { AuthenticationConfig } from '../src/types'

describe('RefreshTokenFactory', () => {
  const sessionManager = new SessionManager({})
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

    const res = mockedResFactory(401, ErrorCodes.NO_REFRESH_TOKEN)

    await refreshTokenFactory(sessionManager, accessTokenConfig)(req, res)
  })

  test('should respond with 401 if invalid refresh token', async () => {
    const req = { body: { refreshToken: 'invalid' } }

    const res = mockedResFactory(401, ErrorCodes.INVALID_OR_EXPIRED_SESSION)

    await refreshTokenFactory(sessionManager, accessTokenConfig)(req, res)
  })

  describe('no cookies', () => {
    test('should refresh if valid existing session', async () => {
      const refreshToken = sessionManager.create(userIdentity.did)

      const req = { body: { refreshToken } }
      const expectedAssertion = (response: MockedResponse) => {
        // eslint-disable-next-line dot-notation
        expect(response['accessToken']).toBeTruthy()
        // eslint-disable-next-line dot-notation
        expect(response['refreshToken']).toBeTruthy()
      }
      const res = mockedResFactory(200, undefined, expectedAssertion)

      await refreshTokenFactory(sessionManager, accessTokenConfig)(req, res)
    })
  })
})
