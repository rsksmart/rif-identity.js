import { Express } from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import csrf from 'csurf'
import { ExpressDidAuthConfig, AppState, SignupBusinessLogic, AuthenticationBusinessLogic } from './types'
import ChallengeVerifierImplementation from './classes/challenge-verifier'
import RequestCounter, { RequestCounterFactory } from './classes/request-counter'
import SessionManager, { SessionManagerFactory } from './classes/session-manager'
import { generateAccessToken, verifyReceivedJwt } from './jwt-utils'
import {
  REQUEST_SIGNUP_PATH, SIGNUP_PATH, REQUEST_AUTH_PATH,
  AUTH_PATH, REFRESH_TOKEN_PATH, LOGOUT_PATH
} from './defaults'
import {
  requestSignupFactory, authenticationFactory, requestAuthFactory,
  refreshTokenFactory, expressMiddlewareFactory, logoutFactory
} from './factories'

export default function setupAppFactory (config: ExpressDidAuthConfig) {
  const { requestAuthPath, authPath, requestSignupPath, signupPath, refreshTokenPath, logoutPath } = config

  const state: AppState = {
    sessions: { },
    refreshTokens: { }
  }

  const challengeVerifier = new ChallengeVerifierImplementation(config)

  const sessionManagerFactory: SessionManagerFactory = (metadata?: any) => new SessionManager(config, metadata)
  const requestCounterFactory: RequestCounterFactory = () => new RequestCounter(config)

  const authHandler = (businessLogic: SignupBusinessLogic | AuthenticationBusinessLogic) => authenticationFactory(
    challengeVerifier, state, sessionManagerFactory, requestCounterFactory, config, businessLogic
  )

  return function setupApp (app: Express) {
    app.use(bodyParser.json())

    if (config.useCookies) {
      app.use(cookieParser())
      app.use(csrf({ cookie: true }))
    }

    const authMiddleware = expressMiddlewareFactory(state, config)

    app.get(requestSignupPath || REQUEST_SIGNUP_PATH, requestSignupFactory(challengeVerifier, config))

    app.post(signupPath || SIGNUP_PATH, authHandler(config.signupBusinessLogic))

    app.get(requestAuthPath || REQUEST_AUTH_PATH, requestAuthFactory(challengeVerifier))

    app.post(authPath || AUTH_PATH, authHandler(config.authenticationBusinessLogic))

    app.post(refreshTokenPath || REFRESH_TOKEN_PATH, refreshTokenFactory(state, config))

    app.post(logoutPath || LOGOUT_PATH, authMiddleware, logoutFactory(state))

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
