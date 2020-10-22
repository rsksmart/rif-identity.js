import { rskDIDFromPrivateKey } from '@rsksmart/rif-id-ethr-did'
import { mnemonicToSeed, seedToRSKHDKey, generateMnemonic } from '@rsksmart/rif-id-mnemonic'
import { createJWT, Signer } from 'did-jwt'
import { ChallengeResponsePayload, SelectiveDisclosureResponse } from '../src/types'

export interface Identity {
  did: string
  signer: Signer
}

export type MockedResponse = string | object


export const mockedResFactory = (expectedStatusCode: 200 | 401 | 500, expectedResponse?: MockedResponse, expectedAssertion?: (response: MockedResponse) => void) => {
  function sendOrJson(response: string | object) {
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

export const identityFactory = async (): Promise<Identity> => {
  const mnemonic = generateMnemonic(12)
  const seed = await mnemonicToSeed(mnemonic)
  const hdKey = seedToRSKHDKey(seed)

  const privateKey = hdKey.derive(0).privateKey.toString('hex')
  return rskDIDFromPrivateKey()(privateKey)
}

export const challengeResponseFactory = async (
  challenge: string,
  issuer: Identity,
  serviceUrl: string,
  sdr?: SelectiveDisclosureResponse
): Promise<string> => {
  const now = Date.now() / 1000
  const payload: ChallengeResponsePayload = {
    challenge,
    aud: serviceUrl,
    exp: now + 120, // 2 mins validity
    nbf: now,
    iat: now,
    sdr
  }

  return createJWT(payload, { issuer: issuer.did, signer: issuer.signer }, { typ: 'JWT', alg: 'ES256K' })
}