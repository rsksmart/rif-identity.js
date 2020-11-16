import { ecrecover, fromRpcSig, hashPersonalMessage, pubToAddress } from 'ethereumjs-util'
import { ACCESS_TOKEN_COOKIE_NAME, COOKIES_ATTRIBUTES, REFRESH_TOKEN_COOKIE_NAME } from '../constants'
import { CORRUPTED_CHALLENGE, /* INVALID_CHALLENGE, */ NO_RESPONSE, UNAUTHORIZED_USER } from '../errors'
import {
  AuthenticationBusinessLogic, SignupBusinessLogic,
  /* ChallengeResponsePayload, */ AppState, AuthenticationConfig
} from '../types'
import { generateAccessToken/*, verifyReceivedJwt */ } from '../jwt-utils'
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

      const expectedMessage = `Login to ${config.serviceUrl}\nVerification code: ${challengeVerifier.get(did)}`

      const messageDigest = hashPersonalMessage(Buffer.from(expectedMessage))
      const ecdsaSignature = fromRpcSig(sig)

      const address = '0x' + pubToAddress(ecrecover(
        messageDigest,
        ecdsaSignature.v,
        ecdsaSignature.r,
        ecdsaSignature.s
      )).toString('hex')

      console.log(address)
      console.log(did)

      if (address !== did.split(':').pop().toLowerCase()) return res.status(401).send(CORRUPTED_CHALLENGE)

      // const { payload } = await verifyReceivedJwt(response, config)
      // const { iss, challenge, sub } = payload as ChallengeResponsePayload

      // if (sub !== config.serviceDid) return res.status(401).send(CORRUPTED_CHALLENGE)

      // if (!challengeVerifier.verify(iss!, challenge)) {
      //  return res.status(401).send(INVALID_CHALLENGE)
      // }

      const isValid = businessLogic ? await businessLogic(null) : true

      if (!isValid) return res.status(401).send(UNAUTHORIZED_USER)

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
