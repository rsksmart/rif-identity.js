import RequestCounter from '../src/classes/request-counter'
import { expressMiddlewareFactory } from '../src/factories/express-middleware-factory'
import { INVALID_HEADER, NO_ACCESS_TOKEN } from '../src/errors'
import { Identity, identityFactory, mockedResFactory } from './utils'
import { AuthenticationConfig } from '../src/types'
import { generateAccessToken } from '../src/jwt-utils'

describe('ExpressMiddlewareFactory', () => {
  const counter = new RequestCounter({})
  const serviceUrl = 'https://service.com'
  const next = jest.fn()

  let authConfig: AuthenticationConfig
  let userIdentity: Identity

  beforeAll(async () => {
    const serviceIdentity = await identityFactory()
    authConfig = {
      serviceDid: serviceIdentity.did,
      serviceSigner: serviceIdentity.signer,
      serviceUrl
    }

    userIdentity = await identityFactory()
  })

  test('should respond with 401 if empty header', async () => {
    const req = { headers: { Authorization: '' } }

    const res = mockedResFactory(401, NO_ACCESS_TOKEN)

    await expressMiddlewareFactory(counter, { serviceUrl })(req, res, next)
  })

  test('should respond with 401 if invalid header', async () => {
    const req = { headers: { Authorization: 'invalid scheme' } }

    const res = mockedResFactory(401, INVALID_HEADER)

    await expressMiddlewareFactory(counter, { serviceUrl })(req, res, next)
  })

  describe('no cookies', () => {
    test('should call next if valid JWT', async () => {
      const accessToken = await generateAccessToken(userIdentity.did, authConfig)

      const req = { headers: { Authorization: `DIDAuth ${accessToken}` } }
      const res = { }

      await expressMiddlewareFactory(counter, { serviceUrl })(req, res, next)

      expect(next.mock.calls).toHaveLength(1)
    })
  })
})
