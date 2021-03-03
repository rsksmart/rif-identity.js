import { rskDIDFromPrivateKey } from '@rsksmart/rif-id-ethr-did'
import { mnemonicToSeedSync, seedToRSKHDKey, generateMnemonic } from '@rsksmart/rif-id-mnemonic'
import { Signer } from 'did-jwt'
import { toRpcSig, ecsign, hashPersonalMessage } from 'ethereumjs-util'
import { AppState, SelectiveDisclosureResponse } from '../src/types'
import { RequestCounter, RequestCounterConfig } from '../src/classes/request-counter'
import { SessionManager, UserSessionConfig } from '../src/classes/session-manager'
import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME, CSRF_TOKEN_HEADER_NAME } from '../src/constants'

export interface Identity {
  did: string
  signer: Signer
}

export type MockedResponse = string | object

// NOTE: this timestamps have modulo 0 when challengeExpirationTimeInSeconds is set to 60
export const modulo0Timestamp = 1603300440000 // modulo0Timestamp % (challengeExpirationTimeInSeconds * 1000) = 0 secs
export const modulo8Timestamp = 1603300448000 // modulo8Timestamp % (challengeExpirationTimeInSeconds * 1000) = 8 secs
export const modulo59Timestamp = 1603300499000 // modulo59Timestamp % (challengeExpirationTimeInSeconds * 1000) = 59 secs
export const otherSlotTimestamp = modulo8Timestamp + 60 * 1000

export const mockedResFactory = (expectedStatusCode: 200 | 401 | 500, expectedResponse?: MockedResponse, expectedAssertion?: (response: MockedResponse) => void) => {
  function sendOrJson (response: string | object) {
    if (expectedResponse) expect(response).toEqual(expectedResponse)

    if (expectedAssertion) expectedAssertion(response)
  }

  return {
    send: sendOrJson,
    json: sendOrJson,
    status: function (statusCode: number) {
      expect(statusCode).toEqual(expectedStatusCode)
      return this
    },
    cookie: jest.fn()
  }
}

export const identityFactory = (): { identity: Identity, privateKey: string } => {
  const mnemonic = generateMnemonic(12)
  const seed = mnemonicToSeedSync(mnemonic)
  const hdKey = seedToRSKHDKey(seed)

  const privateKey = hdKey.derive(0).privateKey.toString('hex')
  return { identity: rskDIDFromPrivateKey()(privateKey), privateKey }
}

export type ChallengeResponse = { did: string, sig: string, sd?: SelectiveDisclosureResponse }

export const challengeResponseFactory = (
  challenge: string,
  issuer: Identity,
  issuerPrivateKey: string,
  serviceUrl: string,
  loginHeaderMessage?: string,
  sd?: SelectiveDisclosureResponse
): ChallengeResponse => {
  const message = loginHeaderMessage
    ? `${loginHeaderMessage}\nURL: ${serviceUrl}\nVerification code: ${challenge}`
    : `URL: ${serviceUrl}\nVerification code: ${challenge}`
  const messageDigest = hashPersonalMessage(Buffer.from(message))

  const ecdsaSignature = ecsign(
    messageDigest,
    Buffer.from(issuerPrivateKey, 'hex')
  )

  return { did: issuer.did, sig: toRpcSig(ecdsaSignature.v, ecdsaSignature.r, ecdsaSignature.s), sd }
}

export const getMockedAppState = (did?: string, counterConfig?: RequestCounterConfig, sessionConfig?: UserSessionConfig): { state: AppState, refreshToken: string} => {
  let refreshToken: string
  const state: AppState = {
    sessions: { },
    refreshTokens: { }
  }

  if (did) {
    state.sessions[did] = {
      requestCounter: new RequestCounter(counterConfig || {}),
      sessionManager: new SessionManager(sessionConfig || {})
    }

    refreshToken = state.sessions[did].sessionManager.createRefreshToken()

    state.refreshTokens[refreshToken] = did
  }

  return { state, refreshToken }
}

export function testChallengeInResponse(response: any) {
  const challenge = response.body.challenge
  expect(challenge).toBeTruthy()
  return challenge
}

export function testAuthenticationResponseForUser(userDid: string) {
  return function (response: any) {
    // tokens in set-cookie header
    const tokens = response.headers['set-cookie']
    expect(tokens).toHaveLength(3)
    expect(tokens[1]).toContain(`${ACCESS_TOKEN_COOKIE_NAME}-${userDid}`)
    expect(tokens[2]).toContain(`${REFRESH_TOKEN_COOKIE_NAME}-${userDid}`)

    // no tokens in the body
    expect(response.body).toEqual({})
    return tokens
  }
}


// for testing purposes, the cookie should be sent without attributes
const removeExtraCookieAttributes = (cookie: string) => cookie.substr(0, cookie.indexOf('; Path=/'))

// gets csrf token from set-cookie header
export function getCSRFTokenFromResponse(response: any) {
  let csrfToken = removeExtraCookieAttributes(
    response.header['set-cookie'].find(h => h.indexOf(CSRF_TOKEN_HEADER_NAME) > -1)
  )

  csrfToken = csrfToken.substr(CSRF_TOKEN_HEADER_NAME.length + 1, csrfToken.length)

  return csrfToken
}

export function getAccessTokenHeader(tokens: string[]) {
  return `${removeExtraCookieAttributes(tokens[1])}; ${removeExtraCookieAttributes(tokens[2])}`
}
