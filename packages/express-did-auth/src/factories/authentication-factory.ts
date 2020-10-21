import { verifyJWT } from 'did-jwt'
import {
  ACCESS_TOKEN_COOKIE_NAME, DEFAULT_REGISTRY_ADDRESS, DEFAULT_RSK_MAINNET_RPC_URL,
  DEFAULT_RSK_TESTNET_RPC_URL, REFRESH_TOKEN_COOKIE_NAME, RSK_MAINNET_NETWORK_NAME, RSK_TESTNET_NETWORK_NAME
} from '../constants'
import { ErrorCodes } from '../errors'
import {
  ChallengeVerifier, SessionManager, AuthenticationBusinessLogic,
  SignupBusinessLogic, TokenConfig, ChallengeResponsePayload, DidResolverConfig
} from '../types'
import generateAccessToken from '../generate-access-token'
import { Resolver } from 'did-resolver'
import { getResolver } from 'ethr-did-resolver'

interface AuthFactoryConfig extends TokenConfig, DidResolverConfig { }

const getDidResolver = (config: DidResolverConfig) => {
  const registry = config.registry || DEFAULT_REGISTRY_ADDRESS
  const networks = config.rpcUrl ? [
    { name: config.networkName || RSK_MAINNET_NETWORK_NAME, registry, rpcUrl: config.rpcUrl }
  ] : [
    { name: RSK_TESTNET_NETWORK_NAME, registry, rpcUrl: DEFAULT_RSK_TESTNET_RPC_URL },
    { name: RSK_MAINNET_NETWORK_NAME, registry, rpcUrl: DEFAULT_RSK_MAINNET_RPC_URL }
  ]
  const ethrDidResolver = getResolver({ networks })
  return new Resolver(ethrDidResolver)
}

export default function authenticationFactory (
  challengeVerifier: ChallengeVerifier,
  sessionManager: SessionManager,
  config: AuthFactoryConfig,
  businessLogic?: AuthenticationBusinessLogic | SignupBusinessLogic
) {
  return async function (req, res) {
    const { response } = req.body

    if (!response) return res.status(401).send(ErrorCodes.NO_RESPONSE)

    const resolver = getDidResolver(config)
    const verified = await verifyJWT(response, { audience: config.serviceUrl, resolver })

    const payload = verified.payload as ChallengeResponsePayload

    if (challengeVerifier.verify(payload.iss!, payload.challenge)) {
      const isValid = businessLogic ? await businessLogic(payload) : true

      if (isValid) {
        const userDid = payload.iss

        const accessToken = await generateAccessToken(userDid, config)
        const refreshToken = sessionManager.create(userDid)

        if (config.useCookies) {
          const cookiesAttributes = { httpOnly: true, sameSite: 'Strict', secure: true }

          res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, cookiesAttributes)
          res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, cookiesAttributes)

          return res.status(200).send()
        }

        return res.status(200).json({ accessToken, refreshToken })
      }

      return res.status(401).send(ErrorCodes.UNAUTHORIZED_USER)
    }

    return res.status(401).send(ErrorCodes.INVALID_CHALLENGE)
  }
}
