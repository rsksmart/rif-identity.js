import { rskDIDFromPrivateKey } from '@rsksmart/rif-id-ethr-did'
import { mnemonicToSeedSync, seedToRSKHDKey, generateMnemonic } from '@rsksmart/rif-id-mnemonic'
import { Signer } from 'did-jwt'
import { toRpcSig, ecsign, hashPersonalMessage } from 'ethereumjs-util'
import { AppState, SelectiveDisclosureResponse } from '../src/types'
import { RequestCounter, RequestCounterConfig } from '../src/classes/request-counter'
import { SessionManager, UserSessionConfig } from '../src/classes/session-manager'

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
    }
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
  const message = `${loginHeaderMessage}\nURL: ${serviceUrl}\nVerification code: ${challenge}`
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
