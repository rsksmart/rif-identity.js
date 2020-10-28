import { ACCESS_TOKEN_COOKIE_NAME, COOKIES_ATTRIBUTES, REFRESH_TOKEN_COOKIE_NAME } from '../constants'
import { INVALID_CHALLENGE, NO_RESPONSE, UNAUTHORIZED_USER } from '../errors'
import {
  AuthenticationBusinessLogic, SignupBusinessLogic,
  ChallengeResponsePayload, AppState, AuthenticationConfig
} from '../types'
import { generateAccessToken, verifyReceivedJwt } from '../jwt-utils'
import { ChallengeVerifier } from '../classes/challenge-verifier'
import { SessionManagerFactory } from '../classes/session-manager'
import { RequestCounterFactory } from '../classes/request-counter'

export function authenticationFactory (
  challengeVerifier: ChallengeVerifier,
  state: AppState,
  sessionManagerFactory: SessionManagerFactory,
  requestCounterFactory: RequestCounterFactory,
  config: AuthenticationConfig,
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

      const did = payload.iss

      const requestCounter = requestCounterFactory()
      const sessionManager = sessionManagerFactory()

      const accessToken = await generateAccessToken(did, config)
      const refreshToken = sessionManager.createRefreshToken()

      state.sessions[did] = { requestCounter, sessionManager }
      state.refreshTokens[refreshToken] = did

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
