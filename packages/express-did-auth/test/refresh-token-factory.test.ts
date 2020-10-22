import SessionManager from '../src/classes/session-manager'
import refreshTokenFactory from '../src/factories/refresh-token-factory'
import { ErrorCodes } from '../src/errors'
import { Identity, identityFactory, mockedResFactory, MockedResponse } from './utils'
import { AuthenticationConfig } from '../src/types'
import { generateAccessToken } from '../src/jwt-helpers'

describe('RefreshTokenFactory', () => {
  const sessionManager = new SessionManager({})
  const serviceUrl = 'https://service.com'

  let accessTokenConfig: AuthenticationConfig
  let userIdentity: Identity

  beforeAll(async () => {
    const serviceIdentity = await identityFactory()
    accessTokenConfig = {
      serviceDid: serviceIdentity.issuer,
      serviceSigner: serviceIdentity.signer,
      serviceUrl
    }

    userIdentity = await identityFactory()
  })

  it('should return 401 if no refresh token', async () => {
    const req = { body: { } }

    const res = mockedResFactory(401, ErrorCodes.NO_REFRESH_TOKEN)

    await refreshTokenFactory(sessionManager, accessTokenConfig)(req, res)
  })

  it('should return 401 if invalid refresh token', async () => {
    const req = { body: { refreshToken: 'invalid' } }

    const res = mockedResFactory(401, ErrorCodes.INVALID_OR_EXPIRED_SESSION)

    await refreshTokenFactory(sessionManager, accessTokenConfig)(req, res)
  })

  describe('no cookies', () => {
    it('should refresh if valid existing session', async () => {
      const refreshToken = sessionManager.create(userIdentity.issuer)

      const req = { body: { refreshToken } }
      const expectedAssertion = (response: MockedResponse) => {
        expect(response['accessToken']).toBeTruthy()
        expect(response['refreshToken']).toBeTruthy()
      }
      const res = mockedResFactory(200, undefined, expectedAssertion)
  
      await refreshTokenFactory(sessionManager, accessTokenConfig)(req, res)
    })
  })
})