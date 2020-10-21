import { createJWT } from 'did-jwt'
import { AccessTokenOptions } from './types'

export default function generateAccessToken(
  subjectDid: string,
  opts: AccessTokenOptions,
  metadata?: any
): Promise<string> {
  const now = Math.floor(Date.now() / 1000) // must be in seconds

  const { serviceUrl, serviceDid, accessTokenExpirationTimeInSeconds, signer } = opts
  const payload = {
    aud: serviceUrl,
    sub: subjectDid,
    exp: `${now + (accessTokenExpirationTimeInSeconds || 10 * 60)}`,
    nbf: `${now}`,
    iat: `${now}`,
    ...metadata
  }

  return createJWT(payload, { issuer: serviceDid, signer }, { typ: 'JWT', alg: 'ES256K' })
}