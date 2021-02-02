import { ecrecover, fromRpcSig, hashPersonalMessage, pubToAddress } from 'ethereumjs-util'
import { ACCESS_TOKEN_COOKIE_NAME, COOKIES_ATTRIBUTES, REFRESH_TOKEN_COOKIE_NAME } from '../constants'
import { INVALID_CHALLENGE_RESPONSE, NO_RESPONSE, UNAUTHORIZED_USER } from '../errors'
import { AuthenticationBusinessLogic, SignupBusinessLogic, AppState, AuthenticationConfig } from '../types'
import { generateAccessToken } from '../jwt-utils'
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

      const { sig, did } = response
      const { loginMessageHeader, allowMultipleSessions, useCookies, serviceUrl } = config

      const expectedMessage = loginMessageHeader
        ? `${loginMessageHeader}\nURL: ${serviceUrl}\nVerification code: ${challengeVerifier.get(did)}`
        : `URL: ${serviceUrl}\nVerification code: ${challengeVerifier.get(did)}`

      const messageDigest = hashPersonalMessage(Buffer.from(expectedMessage))
      const ecdsaSignature = fromRpcSig(sig)

      const address = '0x' + pubToAddress(ecrecover(
        messageDigest,
        ecdsaSignature.v,
        ecdsaSignature.r,
        ecdsaSignature.s
      )).toString('hex')

      if (address !== did.split(':').pop().toLowerCase()) return res.status(401).send(INVALID_CHALLENGE_RESPONSE)

      const isValid = businessLogic ? await businessLogic(response) : true

      if (!isValid) return res.status(401).send(UNAUTHORIZED_USER)

      const requestCounter = requestCounterFactory()
      const sessionManager = sessionManagerFactory()

      const accessToken = await generateAccessToken(did, config)
      const refreshToken = sessionManager.createRefreshToken()

      state.sessions[did] = { requestCounter, sessionManager }
      state.refreshTokens[refreshToken] = did

      if (!useCookies) return res.status(200).json({ accessToken, refreshToken })

      const accessTokenCookieName = allowMultipleSessions ? `${ACCESS_TOKEN_COOKIE_NAME}-${did}` : ACCESS_TOKEN_COOKIE_NAME
      const refreshCookieName = allowMultipleSessions ? `${REFRESH_TOKEN_COOKIE_NAME}-${did}` : REFRESH_TOKEN_COOKIE_NAME

      res.cookie(accessTokenCookieName, accessToken, COOKIES_ATTRIBUTES)
      res.cookie(refreshCookieName, refreshToken, COOKIES_ATTRIBUTES)

      return res.status(200).send()
    } catch (err) {
      if (err.message) return res.status(401).send(escape(err.message))
      return res.status(401).send('Unhandled error')
    }
  }
}
