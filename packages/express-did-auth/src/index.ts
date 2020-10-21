import {
  AccessTokenOptions, ChallengeResponsePayload, ChallengeVerifier, ExpressDidAuthConfig,
  InternalBusinessLogic, RequestCounter, SelectiveDisclosureRequest,
  SessionManager,
  SignupConfig, TokenConfig
} from './types'
import { createJWT, JWTPayload, verifyJWT } from 'did-jwt'
import { ErrorCodes } from './errors'
import ChallengeVerifierImplementation from './challenge-verifier'
import RequestCounterImplementation from './request-counter'
import SessionManagerImplementation from './session-manager'
import { Express } from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'

const ACCESS_TOKEN_COOKIE_NAME = 'authorization'
const REFRESH_TOKEN_COOKIE_NAME = 'refresh-token'
const ACCESS_TOKEN_HEADER_NAME = 'Authorization'

function requestSignupFactory (challengeVerifier: ChallengeVerifier, signupConfig: SignupConfig) {
  return async function (req, res) {
    const { did } = req.params

    const challenge = challengeVerifier.get(did)

    const { requiredClaims, requiredCredentials, serviceDid, signer } = signupConfig
  
    if (requiredClaims || requiredCredentials) {
      const sdrData: SelectiveDisclosureRequest = {
        subject: did,
        issuer: serviceDid, 
        claims: requiredClaims,
        credentials: requiredCredentials,
      }

      const sdr = await createJWT(
        { type: 'sdr', ...sdrData },
        { signer, issuer: serviceDid },
        { typ: 'JWT', alg: 'ES256K' }
      )

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
  subjectDid: string,
  opts: AccessTokenOptions,
  metadata?: any
): Promise<string> {
  const now = Math.floor(Date.now() / 1000) // must be in seconds

  const { serviceUrl, serviceDid, accessTokenExpirationTimeInSeconds, signer } = opts
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

function authenticationFactory(
  challengeVerifier: ChallengeVerifier,
  sessionManager: SessionManager,
  businessLogic: InternalBusinessLogic,
  tokenOptions: TokenConfig
) {
  return async function (req, res) {
      const { response } = req.body

      const verified = await verifyJWT(response, { audience: tokenOptions.serviceUrl })

      const payload = verified.payload as ChallengeResponsePayload
          
      if (challengeVerifier.verify(payload.iss!, payload.challenge)) {
        const isValid = await businessLogic(payload)

        if (isValid) {
          const userDid = payload.iss

          const accessToken = await generateAccessToken(userDid, tokenOptions)
          const refreshToken = sessionManager.create(userDid)

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

function refreshTokenFactory(sessionManager: SessionManager, accessTokenOptions: AccessTokenOptions) {
  return function(req, res) {
    let currentRefreshToken: string
    if (accessTokenOptions.useCookies) {
      currentRefreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME]
    } else {
      currentRefreshToken = req.body.refreshToken
    }

    if (!currentRefreshToken) return res.status(401).send(ErrorCodes.NO_REFRESH_TOKEN)

    const newUserSession = sessionManager.renew(currentRefreshToken)

    if (!newUserSession) {
      res.status(401).send(ErrorCodes.INVALID_OR_EXPIRED_SESSION)
    }

    const { refreshToken, did, metadata } = newUserSession
    const accessToken = generateAccessToken(did, accessTokenOptions, metadata)

    if (accessTokenOptions.useCookies) {
      const cookiesAttributes = { httpOnly: true, sameSite: 'Strict', secure: true }
    
      res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, cookiesAttributes);
      res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, cookiesAttributes);

      return res.status(200).send()
    }

    return res.status(200).json({ accessToken, refreshToken })
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

function logoutFactory(sessionManager: SessionManager) {
  return function(req, res) {
    sessionManager.delete(req.user.did)

    res.status(200).send()
  }
}

export default function setupAppFactory(config: ExpressDidAuthConfig) {
  const { requestAuthPath, authPath, requestSignupPath, signupPath, refreshTokenPath, logoutPath } = config

  const challengeVerifier = new ChallengeVerifierImplementation(config)
  const requestCounter = new RequestCounterImplementation(config)
  const sessionManager = new SessionManagerImplementation(config)

  return function setupApp(app: Express) {
    if (config.useCookies) {
      app.use(cookieParser())
    } else {
      app.use(bodyParser.json())
    }

    if (config.includeSignup) {
      app.get(requestSignupPath || '/request-signup/:did', requestSignupFactory(challengeVerifier, config))

      const signupBusinessLogic: InternalBusinessLogic = async (payload: ChallengeResponsePayload) => {
        if (config.signupBusinessLogic) return config.signupBusinessLogic(payload.did, payload.sdr)
        return true
      }

      app.post(signupPath || '/signup', authenticationFactory(challengeVerifier, sessionManager, signupBusinessLogic, config))
    }

    app.get(requestAuthPath || '/request-auth/:did', requestAuthFactory(challengeVerifier))

    const authBusinessLogic: InternalBusinessLogic = async (payload: ChallengeResponsePayload) => {
      if (config.authenticationBusinessLogic) return config.authenticationBusinessLogic(payload.did)
      return true
    }

    app.post(authPath || '/auth', authenticationFactory(challengeVerifier, sessionManager, authBusinessLogic, config))

    app.post(refreshTokenPath || '/refresh-token', refreshTokenFactory(sessionManager, config))

    app.use(expressMiddlewareFactory(config, requestCounter))

    app.post(logoutPath || '/logout', logoutFactory(sessionManager))
  }
}
