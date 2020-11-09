import { expressMiddlewareFactory } from '../src/factories/express-middleware-factory'
import { CORRUPTED_ACCESS_TOKEN, INVALID_HEADER, MAX_REQUESTS_REACHED, NO_ACCESS_TOKEN } from '../src/errors'
import { getMockedAppState, Identity, identityFactory, mockedResFactory } from './utils'
import { AuthenticationConfig } from '../src/types'
import { generateAccessToken } from '../src/jwt-utils'

describe('ExpressMiddlewareFactory', () => {
  const serviceUrl = 'https://service.com'
  const next = jest.fn()

  let config: AuthenticationConfig
  let userIdentity: Identity

  beforeAll(async () => {
    const serviceIdentity = await identityFactory()
    config = {
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

    await expressMiddlewareFactory(state, config)(req, res, next)
  })

  test('should respond with 401 if invalid header', async () => {
    const req = { headers: { Authorization: 'invalid scheme' } }
    const res = mockedResFactory(401, INVALID_HEADER)
    const { state } = getMockedAppState()

    await expressMiddlewareFactory(state, config)(req, res, next)
  })

  describe('no cookies', () => {
    test('should call next if valid JWT', async () => {
      const accessToken = await generateAccessToken(userIdentity.did, config)
      const { state } = getMockedAppState(userIdentity.did)

      const req = { headers: { Authorization: `DIDAuth ${accessToken}` } }
      const res = { }

      await expressMiddlewareFactory(state, config)(req, res, next)

      expect(next.mock.calls).toHaveLength(1)
    })

    test('should respond with 401 if the issuer of the access token is not the service did', async () => {
      const anotherIdentity = await identityFactory()
      const anotherConfig = {
        serviceDid: anotherIdentity.did,
        serviceSigner: anotherIdentity.signer,
        serviceUrl
      }
      const accessToken = await generateAccessToken(userIdentity.did, anotherConfig)
      const { state } = getMockedAppState(userIdentity.did)

      const req = { headers: { Authorization: `DIDAuth ${accessToken}` } }
      const res = mockedResFactory(401, CORRUPTED_ACCESS_TOKEN)

      await expressMiddlewareFactory(state, config)(req, res, next)
    })

    test('should respond with 401 if exceed amount of requests', async () => {
      const accessToken = await generateAccessToken(userIdentity.did, config)
      const req = { headers: { Authorization: `DIDAuth ${accessToken}` } }
      const { state } = getMockedAppState(userIdentity.did, { maxRequestsPerTimeSlot: 2 })

      // should not fail in the first two intents
      await expressMiddlewareFactory(state, config)(req, {}, next)
      await expressMiddlewareFactory(state, config)(req, {}, next)

      const erroredRes = mockedResFactory(401, MAX_REQUESTS_REACHED)
      await expressMiddlewareFactory(state, config)(req, erroredRes, next)
    })
  })
})
