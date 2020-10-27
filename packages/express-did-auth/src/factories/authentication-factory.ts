import { ACCESS_TOKEN_COOKIE_NAME, COOKIES_ATTRIBUTES, REFRESH_TOKEN_COOKIE_NAME } from '../constants'
import { INVALID_CHALLENGE, NO_RESPONSE, UNAUTHORIZED_USER } from '../errors'
import {
  AuthenticationBusinessLogic, SignupBusinessLogic, TokenConfig,
  ChallengeResponsePayload, DidResolverConfig
} from '../types'
import { generateAccessToken, verifyReceivedJwt } from '../jwt-utils'
import { ChallengeVerifier } from '../classes/challenge-verifier'
import { SessionManager } from '../classes/session-manager'

interface AuthFactoryConfig extends TokenConfig, DidResolverConfig { }

export function authenticationFactory (
  challengeVerifier: ChallengeVerifier,
  sessionManager: SessionManager,
  config: AuthFactoryConfig,
  businessLogic?: AuthenticationBusinessLogic | SignupBusinessLogic
) {
  return async function (req, res) {
    try {
      const { response } = req.body

      if (!response) return res.status(401).send(NO_RESPONSE)

      const verified = await verifyReceivedJwt(response, config)

      const payload = verified.payload as ChallengeResponsePayload

      if (!challengeVerifier.verify(payload.iss!, payload.challenge)) {
        return res.status(401).send(INVALID_CHALLENGE)
      }

      const isValid = businessLogic ? await businessLogic(payload) : true

      if (!isValid) return res.status(401).send(UNAUTHORIZED_USER)

      const userDid = payload.iss

      const accessToken = await generateAccessToken(userDid, config)
      const refreshToken = sessionManager.create(userDid)

      if (!config.useCookies) return res.status(200).json({ accessToken, refreshToken })

      res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, COOKIES_ATTRIBUTES)
      res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, COOKIES_ATTRIBUTES)

      return res.status(200).send()
    } catch (err) {
      if (err.message) return res.status(401).send(escape(err.message))
      return res.status(401).send('Unhandled error')
    }
  }
}
