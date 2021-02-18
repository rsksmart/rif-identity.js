import { Express } from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import csrf from 'csurf'
import { ExpressDidAuthConfig, AppState, SignupBusinessLogic, AuthenticationBusinessLogic } from './types'
import { ChallengeVerifier } from './classes/challenge-verifier'
import { RequestCounter, RequestCounterFactory } from './classes/request-counter'
import { SessionManager, SessionManagerFactory } from './classes/session-manager'
import { generateAccessToken, verifyReceivedJwt } from './jwt-utils'
import {
  REQUEST_SIGNUP_PATH, SIGNUP_PATH, REQUEST_AUTH_PATH,
  AUTH_PATH, REFRESH_TOKEN_PATH, LOGOUT_PATH
} from './defaults'
import {
  requestSignupFactory, authenticationFactory, requestAuthFactory,
  refreshTokenFactory, expressMiddlewareFactory, logoutFactory
} from './factories'
import { adaptToAuthFactoryConfig, adaptToChallengeConfig, adaptToRequestCounterConfig, adaptToUserSessionConfig } from './config-adapters'
import { CSRF_TOKEN_HEADER_NAME } from './constants'
import { CSRF_ERROR_MESSAGE } from './errors'

export default function setupAppFactory (config: ExpressDidAuthConfig) {
  const { requestAuthPath, authPath, requestSignupPath, signupPath, refreshTokenPath, logoutPath } = config

  const state: AppState = {
    sessions: { },
    refreshTokens: { }
  }

  const challengeVerifier = new ChallengeVerifier(adaptToChallengeConfig(config))

  const sessionManagerFactory: SessionManagerFactory = (metadata?: any) => new SessionManager(adaptToUserSessionConfig(config), metadata)
  const requestCounterFactory: RequestCounterFactory = () => new RequestCounter(adaptToRequestCounterConfig(config))

  const authHandler = (businessLogic: SignupBusinessLogic | AuthenticationBusinessLogic) => authenticationFactory(
    challengeVerifier, state, sessionManagerFactory, requestCounterFactory, adaptToAuthFactoryConfig(config), businessLogic
  )

  return function setupApp (app: Express) {
    app.use(bodyParser.json())

    if (config.useCookies) {
      app.use(cookieParser())
      app.use(csrf({ cookie: true }))

      app.use((req, res, next) => {
        res.cookie(CSRF_TOKEN_HEADER_NAME, req.csrfToken())
        next()
      })

      app.use(function (err, req, res, next) {
        if (err.code !== 'EBADCSRFTOKEN') return next(err)
        // handle CSRF token errors here
        res.status(403)
        res.send(CSRF_ERROR_MESSAGE)
      })
    }

    const authMiddleware = expressMiddlewareFactory(state, config)

    app.get(requestSignupPath || REQUEST_SIGNUP_PATH, requestSignupFactory(challengeVerifier, config))

    app.post(signupPath || SIGNUP_PATH, authHandler(config.signupBusinessLogic))

    app.get(requestAuthPath || REQUEST_AUTH_PATH, requestAuthFactory(challengeVerifier))

    app.post(authPath || AUTH_PATH, authHandler(config.authenticationBusinessLogic))

    app.post(refreshTokenPath || REFRESH_TOKEN_PATH, refreshTokenFactory(state, config))

    app.post(logoutPath || LOGOUT_PATH, authMiddleware, logoutFactory(state, config))

    return authMiddleware
  }
}

export {
  authenticationFactory,
  expressMiddlewareFactory,
  refreshTokenFactory,
  logoutFactory,
  requestAuthFactory,
  requestSignupFactory,
  generateAccessToken,
  verifyReceivedJwt
}

export * from './types'
