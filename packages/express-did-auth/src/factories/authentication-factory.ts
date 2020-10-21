import { verifyJWT } from 'did-jwt'
import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from '../constants'
import { ErrorCodes } from '../errors'
import {
  ChallengeVerifier, SessionManager, AuthenticationBusinessLogic,
  SignupBusinessLogic, TokenConfig, ChallengeResponsePayload
} from '../types'
import generateAccessToken from '../generate-access-token'

export default function authenticationFactory (
  challengeVerifier: ChallengeVerifier,
  sessionManager: SessionManager,
  businessLogic: AuthenticationBusinessLogic | SignupBusinessLogic,
  tokenOptions: TokenConfig
) {
  return async function (req, res) {
    const { response } = req.body

    const verified = await verifyJWT(response, { audience: tokenOptions.serviceUrl })

    const payload = verified.payload as ChallengeResponsePayload

    if (challengeVerifier.verify(payload.iss!, payload.challenge)) {
      const isValid = businessLogic ? await businessLogic(payload) : true

      if (isValid) {
        const userDid = payload.iss

        const accessToken = await generateAccessToken(userDid, tokenOptions)
        const refreshToken = sessionManager.create(userDid)

        if (tokenOptions.useCookies) {
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
