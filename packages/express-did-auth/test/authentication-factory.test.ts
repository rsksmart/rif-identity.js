import { authenticationFactory } from '../src/factories/authentication-factory'
import { ChallengeVerifier } from '../src/classes/challenge-verifier'
import {
  identityFactory, challengeResponseFactory, getMockedAppState, Identity, mockedResFactory,
  MockedResponse, modulo0Timestamp, otherSlotTimestamp
} from './utils'
import MockDate from 'mockdate'
import { INVALID_CHALLENGE_RESPONSE, NO_RESPONSE, UNAUTHORIZED_USER } from '../src/errors'
import { AppState, AuthenticationBusinessLogic, AuthenticationConfig, SelectiveDisclosureResponse, SignupBusinessLogic, SignupChallengeResponsePayload } from '../src/types'
import { RequestCounter, RequestCounterConfig, RequestCounterFactory } from '../src/classes/request-counter'
import { SessionManager, SessionManagerFactory, UserSessionConfig } from '../src/classes/session-manager'

describe('authenticationFactory', () => {
  let config: AuthenticationConfig
  let userIdentity: Identity
  let userPrivateKey: string
  let state: AppState

  const mockBusinessLogicFactory = (result: boolean) => async () => result
  const challengeSecret = 'theSecret'
  const challengeExpirationTime = 60000

  const challengeVerifier = new ChallengeVerifier({ challengeSecret, challengeExpirationTime })

  const sessionManagerFactory: SessionManagerFactory = (config?: UserSessionConfig) => new SessionManager(config || {})
  const requestCounterFactory: RequestCounterFactory = (config?: RequestCounterConfig) => new RequestCounter(config || {})
  const testAuthFactory = (state: AppState, logic?: SignupBusinessLogic | AuthenticationBusinessLogic) => authenticationFactory(
    challengeVerifier, state, sessionManagerFactory, requestCounterFactory, config, logic
  )

  beforeAll(async () => {
    const serviceIdentity = await identityFactory().identity
    config = {
      serviceDid: serviceIdentity.did,
      serviceSigner: serviceIdentity.signer,
      serviceUrl: 'https://the.service.com',
      loginMessageHeader: 'This is the login message header:'
    }

    const { identity, privateKey } = identityFactory()
    userIdentity = identity
    userPrivateKey = privateKey
  })

  beforeEach(() => {
    ({ state } = getMockedAppState())
  })

  afterEach(() => MockDate.reset())

  test('should respond with 401 if no response', async () => {
    const res = mockedResFactory(401, NO_RESPONSE)
    const req = { body: { } }

    await testAuthFactory(state)(req, res)
  })

  test('should respond with 401 if the signed message contains another service url', async () => {
    MockDate.set(modulo0Timestamp)

    const challenge = challengeVerifier.get(userIdentity.did)

    const challengeResponseJwt = challengeResponseFactory(challenge, userIdentity, userPrivateKey, 'https://taringa.net')

    const req = { body: { response: challengeResponseJwt } }
    const res = mockedResFactory(401, INVALID_CHALLENGE_RESPONSE)

    const logic = mockBusinessLogicFactory(false)
    await testAuthFactory(state, logic)(req, res)
  })

  test('should respond with 401 if the message is signed with another did', async () => {
    MockDate.set(modulo0Timestamp)

    const challenge = challengeVerifier.get(userIdentity.did)
    const anotherIdentity = await identityFactory()

    const challengeResponseJwt = challengeResponseFactory(challenge, anotherIdentity.identity, anotherIdentity.privateKey, config.serviceUrl)

    const req = { body: { response: challengeResponseJwt } }
    const res = mockedResFactory(401, INVALID_CHALLENGE_RESPONSE)

    const logic = mockBusinessLogicFactory(false)
    await testAuthFactory(state, logic)(req, res)
  })

  test('should respond with 401 if the challenge is signed with another header', async () => {
    MockDate.set(modulo0Timestamp)

    const challenge = challengeVerifier.get(userIdentity.did)
    const anotherIdentity = await identityFactory()

    const challengeResponseJwt = challengeResponseFactory(challenge, anotherIdentity.identity, anotherIdentity.privateKey, 'https://taringa.net', 'Another header')
    challengeResponseJwt.did = userIdentity.did

    const req = { body: { response: challengeResponseJwt } }
    const res = mockedResFactory(401, INVALID_CHALLENGE_RESPONSE)

    const logic = mockBusinessLogicFactory(false)
    await testAuthFactory(state, logic)(req, res)
  })

  test('should respond with 401 if the signer of the message is not the specified did', async () => {
    MockDate.set(modulo0Timestamp)

    const challenge = challengeVerifier.get(userIdentity.did)
    const anotherIdentity = await identityFactory()

    const challengeResponseJwt = challengeResponseFactory(challenge, anotherIdentity.identity, anotherIdentity.privateKey, 'https://taringa.net')
    challengeResponseJwt.did = userIdentity.did

    const req = { body: { response: challengeResponseJwt } }
    const res = mockedResFactory(401, INVALID_CHALLENGE_RESPONSE)

    const logic = mockBusinessLogicFactory(false)
    await testAuthFactory(state, logic)(req, res)
  })

  test('should respond with 401 if invalid challenge', async () => {
    MockDate.set(modulo0Timestamp)

    const challengeResponseJwt = challengeResponseFactory('a challenge', userIdentity, userPrivateKey, config.serviceUrl)

    const req = { body: { response: challengeResponseJwt } }
    const res = mockedResFactory(401, INVALID_CHALLENGE_RESPONSE)

    MockDate.set(otherSlotTimestamp)
    await testAuthFactory(state)(req, res)
  })

  test('should respond with 401 if extra business logic that returns false', async () => {
    MockDate.set(modulo0Timestamp)

    const challenge = challengeVerifier.get(userIdentity.did)
    const challengeResponseJwt = challengeResponseFactory(challenge, userIdentity, userPrivateKey, config.serviceUrl, config.loginMessageHeader)

    const req = { body: { response: challengeResponseJwt } }
    const res = mockedResFactory(401, UNAUTHORIZED_USER)

    const logic = mockBusinessLogicFactory(false)
    await testAuthFactory(state, logic)(req, res)
  })

  test('should respond with 401 if extra business logic that throws an error', async () => {
    MockDate.set(modulo0Timestamp)

    const challenge = challengeVerifier.get(userIdentity.did)
    const challengeResponseJwt = challengeResponseFactory(challenge, userIdentity, userPrivateKey, config.serviceUrl, config.loginMessageHeader)

    const errorMessage = 'This is an error'
    const req = { body: { response: challengeResponseJwt } }
    const res = mockedResFactory(401, escape(errorMessage))

    const logic = () => { throw new Error(errorMessage) }
    await testAuthFactory(state, logic)(req, res)
  })

  test('should execute business logic with selective disclosure', async () => {
    MockDate.set(modulo0Timestamp)

    const challenge = challengeVerifier.get(userIdentity.did)
    const sd: SelectiveDisclosureResponse = {
      credentials: {
        Email: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiRW1haWwiXSwiY3JlZGVudGlhbFNjaGVtYSI6eyJpZCI6ImRpZDpldGhyOnJzazoweDhhMzJkYTYyNGRkOWZhZDhiZjRmMzJkOTQ1NmYzNzRiNjBkOWFkMjg7aWQ9MWViMmFmNmItMGRlZS02MDkwLWNiNTUtMGVkMDkzZjliMDI2O3ZlcnNpb249MS4wIiwidHlwZSI6Ikpzb25TY2hlbWFWYWxpZGF0b3IyMDE4In0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImVtYWlsQWRkcmVzcyI6ImlsYW5AaW92cHVicy5vcmcifX0sInN1YiI6ImRpZDpldGhyOnJzazp0ZXN0bmV0OjB4OTQ1YjU5ZDVhODZlMmM3ZDUxZjk2MWY0OTg3ZThiMGNhZDRhNGY1NyIsImlzcyI6ImRpZDpldGhyOnJzazoweDcwMDljZGNiZTQxZGQ2MmRkN2U2Y2NmZDhiNzY4OTMyMDdmYmJhNjgifQ.BFd13fjWVGRFYjRDqLuFhtr3xR2kz6CowKOxtWu06m8h_LVcTDTn0A-2VUQo9AsSBjXt7VSRkNeitRrv6lOq3Q'
      },
      claims: {
        Name: 'John Lennon'
      }
    }
    const challengeResponseJwt = challengeResponseFactory(challenge, userIdentity, userPrivateKey, config.serviceUrl, config.loginMessageHeader, sd)

    const req = { body: { response: challengeResponseJwt } }
    const res = mockedResFactory(200, undefined)

    const logic = (receivedSd: SignupChallengeResponsePayload) => {
      expect(receivedSd.sd).toEqual(sd)
      return Promise.resolve(true)
    }

    await testAuthFactory(state, logic)(req, res)
  })

  describe('no cookies', () => {
    let req, res

    beforeEach(async () => {
      MockDate.set(modulo0Timestamp)

      const challenge = challengeVerifier.get(userIdentity.did)
      const response = challengeResponseFactory(challenge, userIdentity, userPrivateKey, config.serviceUrl, config.loginMessageHeader)
      req = { body: { response } }

      const expectedAssertion = (response: MockedResponse) => {
        // eslint-disable-next-line dot-notation
        expect(response['accessToken']).toBeTruthy()
        // eslint-disable-next-line dot-notation
        expect(response['refreshToken']).toBeTruthy()
      }
      res = mockedResFactory(200, undefined, expectedAssertion)
    })

    test('no extra business logic', async () => {
      await testAuthFactory(state)(req, res)
    })

    test('extra business logic that returns true', async () => {
      const logic = mockBusinessLogicFactory(true)
      await testAuthFactory(state, logic)(req, res)
    })
  })
})
