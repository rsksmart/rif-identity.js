import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from '../constants'
import { ErrorCodes } from '../errors'
import {
  ChallengeVerifier, SessionManager, AuthenticationBusinessLogic,
  SignupBusinessLogic, TokenConfig, ChallengeResponsePayload, DidResolverConfig
} from '../types'
import { generateAccessToken, verifyAccessToken } from '../jwt-utils'

interface AuthFactoryConfig extends TokenConfig, DidResolverConfig { }

export default function authenticationFactory (
  challengeVerifier: ChallengeVerifier,
  sessionManager: SessionManager,
  config: AuthFactoryConfig,
  businessLogic?: AuthenticationBusinessLogic | SignupBusinessLogic
) {
  return async function (req, res) {
    const { response } = req.body

    if (!response) return res.status(401).send(ErrorCodes.NO_RESPONSE)

    const verified = await verifyAccessToken(response, config)

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
