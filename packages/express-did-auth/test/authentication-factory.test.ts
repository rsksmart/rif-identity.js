import authenticationFactory from '../src/factories/authentication-factory'
import ChallengeVerifier from '../src/classes/challenge-verifier'
import SessionManager from '../src/classes/session-manager'
import { challengeResponseFactory, Identity, identityFactory, mockedResFactory, MockedResponse } from './utils'
import MockDate from 'mockdate'
import { ErrorCodes } from '../src/errors'
import { TokenConfig } from '../src/types'
import { Signer } from 'did-jwt'

describe('authenticationFactory', () => {
  
  const challengeSecret = 'theSecret'
  const challengeExpirationTimeInSeconds = 60

  const modulo0Timestamp = 1603300440000
  
  const challengeVerifier = new ChallengeVerifier({ challengeSecret, challengeExpirationTimeInSeconds })
  const sessionManager = new SessionManager({})
  
  let config: TokenConfig
  let userIdentity: Identity

  beforeAll(async () => {
    const serviceIdentity = await identityFactory()
    config = {
      serviceDid: serviceIdentity.issuer,
      serviceSigner: serviceIdentity.signer,
      serviceUrl: 'https://the.service.com'
    }

    userIdentity = await identityFactory()
  })

  it('should return 401 if no response', async () => {
    const res = mockedResFactory(401, ErrorCodes.NO_RESPONSE)
    const req = { body: { } }

    await authenticationFactory(challengeVerifier, sessionManager, config)(req, res)
  })

  it('no cookies no extra business logic', async () => {
    MockDate.set(modulo0Timestamp)

    const challenge = challengeVerifier.get(userIdentity.issuer)
    const challengeResponseJwt = await challengeResponseFactory(challenge, userIdentity, config.serviceUrl, modulo0Timestamp)
    
    const req = { body: { response: challengeResponseJwt } }

    const expectedAssertion = (response: MockedResponse) => {
      expect(response['accessToken']).toBeTruthy()
      expect(response['refreshToken']).toBeTruthy()
    }
    const res = mockedResFactory(200, undefined, expectedAssertion)

    await authenticationFactory(challengeVerifier, sessionManager, config)(req, res)
  })

  
})
