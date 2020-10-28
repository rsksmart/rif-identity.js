import { expressMiddlewareFactory } from '../src/factories/express-middleware-factory'
import { INVALID_HEADER, MAX_REQUESTS_REACHED, NO_ACCESS_TOKEN } from '../src/errors'
import { getMockedAppState, Identity, identityFactory, mockedResFactory } from './utils'
import { AuthenticationConfig } from '../src/types'
import { generateAccessToken } from '../src/jwt-utils'

describe('ExpressMiddlewareFactory', () => {
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
    const { state } = getMockedAppState()

    await expressMiddlewareFactory(state, { serviceUrl })(req, res, next)
  })

  test('should respond with 401 if invalid header', async () => {
    const req = { headers: { Authorization: 'invalid scheme' } }
    const res = mockedResFactory(401, INVALID_HEADER)
    const { state } = getMockedAppState()

    await expressMiddlewareFactory(state, { serviceUrl })(req, res, next)
  })

  describe('no cookies', () => {
    test('should call next if valid JWT', async () => {
      const accessToken = await generateAccessToken(userIdentity.did, authConfig)
      const { state } = getMockedAppState(userIdentity.did)

      const req = { headers: { Authorization: `DIDAuth ${accessToken}` } }
      const res = { }

      await expressMiddlewareFactory(state, { serviceUrl })(req, res, next)

      expect(next.mock.calls).toHaveLength(1)
    })

    test('should respond with 401 if exceed amount of requests', async () => {
      const accessToken = await generateAccessToken(userIdentity.did, authConfig)
      const req = { headers: { Authorization: `DIDAuth ${accessToken}` } }
      const { state } = getMockedAppState(userIdentity.did, { maxRequestsPerTimeSlot: 2 })

      // should not fail in the first two intents
      await expressMiddlewareFactory(state, { serviceUrl })(req, {}, next)
      await expressMiddlewareFactory(state, { serviceUrl })(req, {}, next)

      const erroredRes = mockedResFactory(401, MAX_REQUESTS_REACHED)
      await expressMiddlewareFactory(state, { serviceUrl })(req, erroredRes, next)
    })
  })
})
