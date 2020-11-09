import { createJWT, JWTVerified, verifyJWT } from 'did-jwt'
import { Resolver } from 'did-resolver'
import { getResolver } from 'ethr-did-resolver'
import {
  REGISTRY_ADDRESS, RSK_MAINNET_NETWORK_NAME, RSK_MAINNET_RPC_URL,
  RSK_TESTNET_NETWORK_NAME, RSK_TESTNET_RPC_URL
} from './constants'
import { ACCESS_TOKEN_EXPIRATION } from './defaults'
import { EXPIRED_ACCESS_TOKEN, INVALID_ACCESS_TOKEN } from './errors'
import { AuthenticationConfig, DidResolverConfig, TokenValidationConfig } from './types'

export function generateAccessToken (
  subjectDid: string,
  config: AuthenticationConfig,
  metadata?: any
): Promise<string> {
  const now = Math.floor(Date.now() / 1000) // must be in seconds

  const { serviceUrl, serviceDid, accessTokenExpirationTime, serviceSigner: signer } = config

  const payload = {
    ...metadata,
    aud: serviceUrl,
    sub: subjectDid,
    exp: `${now + Math.floor((accessTokenExpirationTime || ACCESS_TOKEN_EXPIRATION) / 1000)}`,
    nbf: `${now}`,
    iat: `${now}`
  }

  return createJWT(payload, { issuer: serviceDid, signer }, { typ: 'JWT', alg: 'ES256K' })
}

export function getDidResolver (config: DidResolverConfig) {
  const registry = config.registry || REGISTRY_ADDRESS

  const networks = config.rpcUrl ? [
    { name: config.networkName || RSK_MAINNET_NETWORK_NAME, registry, rpcUrl: config.rpcUrl }
  ] : [
    { name: RSK_TESTNET_NETWORK_NAME, registry, rpcUrl: RSK_TESTNET_RPC_URL },
    { name: RSK_MAINNET_NETWORK_NAME, registry, rpcUrl: RSK_MAINNET_RPC_URL }
  ]

  const ethrDidResolver = getResolver({ networks })
  return new Resolver(ethrDidResolver)
}

export async function verifyReceivedJwt (
  token: string, config: TokenValidationConfig
): Promise<JWTVerified> {
  const resolver = getDidResolver(config)

  const verified = await verifyJWT(token, { audience: config.serviceUrl, resolver })

  const now = Math.floor(Date.now() / 1000)

  if (verified.payload.exp < now) throw new Error(EXPIRED_ACCESS_TOKEN)
  if (verified.payload.nbf > now) throw new Error(INVALID_ACCESS_TOKEN)

  return verified
}
