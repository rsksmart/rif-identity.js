import {
  AccessTokenOptions, ChallengeResponsePayload, ChallengeVerifier, ExpressDidAuthConfig,
  InternalBusinessLogic, RequestCounter, SelectiveDisclosureRequest,
  SignupConfig, TokenConfig
} from './types'
import { createJWT, JWTPayload, Signer, verifyJWT } from 'did-jwt'
import { randomBytes } from 'crypto'
import { ErrorCodes } from './errors'
import ChallengeVerifierImplementation from './challenge-verifier'
import RequestCounterImplementation from './request-counter'
import { Express } from 'express'

const ACCESS_TOKEN_COOKIE_NAME = 'authorization'
const REFRESH_TOKEN_COOKIE_NAME = 'refresh-token'
const ACCESS_TOKEN_HEADER_NAME = 'Authorization'

function requestSignupFactory (challengeVerifier: ChallengeVerifier, signupConfig: SignupConfig) {
  return function (req, res) {
    const { did } = req.params

    const challenge = challengeVerifier.get(did)

    const { requiredClaims, requiredCredentials } = signupConfig
    if (requiredClaims || requiredCredentials) {
      const sdr: SelectiveDisclosureRequest = {
        sub: did,
        claims: requiredClaims,
        credentials: requiredCredentials,
      }

      // TODO: Sign sdr

      return res.status(200).send({ challenge, sdr })
    }

    return res.status(200).send({ challenge })
  }
}

function requestAuthFactory (challengeVerifier: ChallengeVerifier) {
  return function (req, res) {
    const { did } = req.params

    const challenge = challengeVerifier.get(did)

    res.status(200).send({ challenge })
  }
}

function generateAccessToken(
  signer: Signer,
  subjectDid: string,
  opts: AccessTokenOptions,
  metadata?: any
): Promise<string> {
  const now = Math.floor(Date.now() / 1000) // must be in seconds

  const { serviceUrl, serviceDid, accessTokenExpirationTimeInSeconds } = opts
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

function validateChallengeFactory(
  challengeVerifier: ChallengeVerifier,
  signer: Signer,
  businessLogic: InternalBusinessLogic,
  tokenOptions: TokenConfig
) {
  return async function (req, res) {
      const { response } = req.body

      const verified = await verifyJWT(response, { audience: tokenOptions.serviceUrl })

      const payload = verified.payload as ChallengeResponsePayload
          
      if (challengeVerifier.verify(payload.iss!, payload.challenge)) {
        const isValid = businessLogic ? await businessLogic(payload) : true

        if (isValid) {
            const accessToken = await generateAccessToken(signer, payload.iss, tokenOptions)
            const refreshToken = randomBytes(64).toString('hex')

            // TODO: Save session data

            if (tokenOptions.useCookies) {
              const cookiesAttributes = { httpOnly: true, sameSite: 'Strict', secure: true }
            
              res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, cookiesAttributes);
              res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, cookiesAttributes);

              return res.status(200).send()
            }

            return res.status(200).json({ accessToken, refreshToken })
        }

        return res.status(401).send(ErrorCodes.UNAUTHORIZED_USER)
      }
      
      return res.status(401).send(ErrorCodes.INVALID_CHALLENGE)
  }
}

function expressMiddlewareFactory(tokenOptions: TokenConfig, requestCounter: RequestCounter) {
  return async function expressMiddleware(req, res, next) {
    try {
      let jwt: string
      if (tokenOptions.useCookies) {
        jwt = req.cookies[ACCESS_TOKEN_COOKIE_NAME]
      } else {
        jwt = req.headers[ACCESS_TOKEN_HEADER_NAME]
      }

      if (!jwt) return res.status(401).send(ErrorCodes.NO_ACCESS_TOKEN)

      const verified = await verifyJWT(jwt, { audience: tokenOptions.serviceUrl })

      const payload = verified.payload as JWTPayload

      const now = Math.floor(Date.now() / 1000)

      if (payload.exp < now) res.status(401).send(ErrorCodes.EXPIRED_ACCESS_TOKEN)
      if (payload.nbf > now) res.status(401).send(ErrorCodes.INVALID_ACCESS_TOKEN)
      
      const did = payload.sub
      
      requestCounter.count(did)

      req.user = { did }

      next()
    } catch (err) {
      if (err?.message) {
        res.status(401).send(err.message)
      } else {
        res.status(500).send(ErrorCodes.UNHANDLED_ERROR)
      }
    }
  }
}

export default function setupAppFactory(config: ExpressDidAuthConfig) {
  const { requestAuthPath, authPath, requestSignupPath, signupPath } = config 
  const challengeVerifier = new ChallengeVerifierImplementation(config)
  const requestCounter = new RequestCounterImplementation(config)

  return function setupApp(app: Express) {
    if (config.includeSignup) {
      app.get(requestSignupPath || '/request-signup/:did', requestSignupFactory(challengeVerifier, config))

      const signupBusinessLogic: InternalBusinessLogic = (payload: ChallengeResponsePayload) => {
        if (config.signupBusinessLogic) return config.signupBusinessLogic(payload.did, payload.sdr)
      }

      app.post(signupPath || '/signup', validateChallengeFactory(challengeVerifier, config.signer, signupBusinessLogic, config))
    }

    app.get(requestAuthPath || '/request-auth/:did', requestAuthFactory(challengeVerifier))

    const authBusinessLogic: InternalBusinessLogic = (payload: ChallengeResponsePayload) => {
      if (config.authenticationBusinessLogic) return config.authenticationBusinessLogic(payload.did)
    }

    app.post(authPath || '/auth', validateChallengeFactory(challengeVerifier, config.signer, authBusinessLogic, config))

    app.use(expressMiddlewareFactory(config, requestCounter))
  }
}