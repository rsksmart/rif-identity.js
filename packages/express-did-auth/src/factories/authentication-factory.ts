import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from '../constants'
import { ErrorCodes } from '../errors'
import {
  AuthenticationBusinessLogic, SignupBusinessLogic, TokenConfig,
  ChallengeResponsePayload, DidResolverConfig
} from '../types'
import { generateAccessToken, verifyReceivedJwt } from '../jwt-utils'
import { ChallengeVerifier } from '../classes/challenge-verifier'
import { SessionManager } from '../classes/session-manager'

interface AuthFactoryConfig extends TokenConfig, DidResolverConfig { }

export default function authenticationFactory (
  challengeVerifier: ChallengeVerifier,
  sessionManager: SessionManager,
  config: AuthFactoryConfig,
  businessLogic?: AuthenticationBusinessLogic | SignupBusinessLogic
) {
  return async function (req, res) {
    try {
      const { response } = req.body

      if (!response) return res.status(401).send(ErrorCodes.NO_RESPONSE)

      const verified = await verifyReceivedJwt(response, config)

      const payload = verified.payload as ChallengeResponsePayload

      if (challengeVerifier.verify(payload.iss!, payload.challenge)) {
        const isValid = businessLogic ? await businessLogic(payload) : true

        if (isValid) {
          const userDid = payload.iss

          const accessToken = await generateAccessToken(userDid, config)
          const refreshToken = sessionManager.create(userDid)

          if (config.useCookies) {
            const cookiesAttributes = { httpOnly: true, sameSite: 'Strict' } //, secure: true }

            res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, cookiesAttributes)
            res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, cookiesAttributes)

            return res.status(200).send()
          }

          return res.status(200).json({ accessToken, refreshToken })
        }
        return res.status(401).send(ErrorCodes.UNAUTHORIZED_USER)
      }

      return res.status(401).send(ErrorCodes.INVALID_CHALLENGE)
    } catch (err) {
      if (err.message) return res.status(401).send(escape(err.message))
      return res.status(401).send('Unhandled error')
    }
  }
}
