import RequestCounter from '../src/classes/request-counter'
import expressMiddlewareFactory from '../src/factories/express-middleware-factory'
import { ErrorCodes } from '../src/errors'
import { Identity, identityFactory, mockedResFactory } from './utils'
import { AuthenticationConfig } from '../src/types'
import { generateAccessToken } from '../src/jwt-helpers'

describe('ExpressMiddlewareFactory', () => {
  const counter = new RequestCounter({})
  const serviceUrl = 'https://service.com'
  const next = jest.fn()

  let authConfig: AuthenticationConfig
  let userIdentity: Identity

  beforeAll(async () => {
    const serviceIdentity = await identityFactory()
    authConfig = {
      serviceDid: serviceIdentity.issuer,
      serviceSigner: serviceIdentity.signer,
      serviceUrl
    }

    userIdentity = await identityFactory()
  })

  it.each([[''], ['invalid scheme']])('should return 401 if invalid header: %s', async (token: string) => {
    const req = { headers: { Authorization: token } }

    const res = mockedResFactory(401, ErrorCodes.INVALID_HEADER)

    await expressMiddlewareFactory(counter, { serviceUrl })(req, res, next)
  })

  describe('no cookies', () => {
    it('should call next if valid JWT', async () => {
      const accessToken = await generateAccessToken(userIdentity.issuer, authConfig)

      const req = { headers: { Authorization: `DIDAuth ${accessToken}` } }
      const res = { }
  
      await expressMiddlewareFactory(counter, { serviceUrl })(req, res, next)

      expect(next.mock.calls).toHaveLength(1)
    })
  })
})