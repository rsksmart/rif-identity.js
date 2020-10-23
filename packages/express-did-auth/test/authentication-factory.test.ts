import authenticationFactory from '../src/factories/authentication-factory'
import ChallengeVerifier from '../src/classes/challenge-verifier'
import SessionManager from '../src/classes/session-manager'
import {
  challengeResponseFactory, Identity, identityFactory, mockedResFactory,
  MockedResponse, modulo0Timestamp, otherSlotTimestamp
} from './utils'
import MockDate from 'mockdate'
import { ErrorCodes } from '../src/errors'
import { TokenConfig } from '../src/types'

describe('authenticationFactory', () => {
  const mockBusinessLogicFactory = (result: boolean) => async () => result
  const challengeSecret = 'theSecret'
  const challengeExpirationTimeInSeconds = 60

  const challengeVerifier = new ChallengeVerifier({ challengeSecret, challengeExpirationTimeInSeconds })
  const sessionManager = new SessionManager({})

  let config: TokenConfig
  let userIdentity: Identity

  beforeAll(async () => {
    const serviceIdentity = await identityFactory()
    config = {
      serviceDid: serviceIdentity.did,
      serviceSigner: serviceIdentity.signer,
      serviceUrl: 'https://the.service.com'
    }

    userIdentity = await identityFactory()
  })

  afterEach(() => MockDate.reset())

  it('should return 401 if no response', async () => {
    const res = mockedResFactory(401, ErrorCodes.NO_RESPONSE)
    const req = { body: { } }

    await authenticationFactory(challengeVerifier, sessionManager, config)(req, res)
  })

  it('should return 401 if extra business logic that returns false ', async () => {
    MockDate.set(modulo0Timestamp)

    const challenge = challengeVerifier.get(userIdentity.did)
    const challengeResponseJwt = await challengeResponseFactory(challenge, userIdentity, config.serviceUrl)

    const req = { body: { response: challengeResponseJwt } }
    const res = mockedResFactory(401, ErrorCodes.UNAUTHORIZED_USER)

    const logic = mockBusinessLogicFactory(false)
    await authenticationFactory(challengeVerifier, sessionManager, config, logic)(req, res)
  })

  it('should return 401 if invalid challenge', async () => {
    MockDate.set(modulo0Timestamp)

    const challenge = challengeVerifier.get(userIdentity.did)
    const challengeResponseJwt = await challengeResponseFactory(challenge, userIdentity, config.serviceUrl)

    const req = { body: { response: challengeResponseJwt } }
    const res = mockedResFactory(401, ErrorCodes.INVALID_CHALLENGE)

    MockDate.set(otherSlotTimestamp)
    await authenticationFactory(challengeVerifier, sessionManager, config)(req, res)
  })

  describe('no cookies', () => {
    let req, res

    beforeEach(async () => {
      MockDate.set(modulo0Timestamp)

      const challenge = challengeVerifier.get(userIdentity.did)
      const challengeResponseJwt = await challengeResponseFactory(challenge, userIdentity, config.serviceUrl)

      req = { body: { response: challengeResponseJwt } }

      const expectedAssertion = (response: MockedResponse) => {
        // eslint-disable-next-line dot-notation
        expect(response['accessToken']).toBeTruthy()
        // eslint-disable-next-line dot-notation
        expect(response['refreshToken']).toBeTruthy()
      }
      res = mockedResFactory(200, undefined, expectedAssertion)
    })

    it('no extra business logic', async () => {
      await authenticationFactory(challengeVerifier, sessionManager, config)(req, res)
    })

    it('extra business logic that returns true', async () => {
      const logic = mockBusinessLogicFactory(true)
      await authenticationFactory(challengeVerifier, sessionManager, config, logic)(req, res)
    })
  })
})
