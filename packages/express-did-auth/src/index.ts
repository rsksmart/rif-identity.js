import { Express } from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import csrf from 'csurf'
import { ExpressDidAuthConfig } from './types'
import ChallengeVerifierImplementation from './classes/challenge-verifier'
import RequestCounterImplementation from './classes/request-counter'
import SessionManagerImplementation from './classes/session-manager'
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

  const challengeVerifier = new ChallengeVerifierImplementation(config)
  const requestCounter = new RequestCounterImplementation(config)
  const sessionManager = new SessionManagerImplementation(config)

  return function setupApp (app: Express) {
    app.use(bodyParser.json())

    if (config.useCookies) {
      app.use(cookieParser())
      app.use(csrf({ cookie: true }))
    }

    if (config.includeSignup) {
      app.get(requestSignupPath || REQUEST_SIGNUP_PATH, requestSignupFactory(challengeVerifier, config))

      app.post(signupPath || SIGNUP_PATH, authenticationFactory(challengeVerifier, sessionManager, config, config.signupBusinessLogic))
    }

    app.get(requestAuthPath || REQUEST_AUTH_PATH, requestAuthFactory(challengeVerifier))

    app.post(authPath || AUTH_PATH, authenticationFactory(challengeVerifier, sessionManager, config, config.authenticationBusinessLogic))

    app.post(refreshTokenPath || REFRESH_TOKEN_PATH, refreshTokenFactory(sessionManager, config))

    app.use(expressMiddlewareFactory(requestCounter, config))

    app.post(logoutPath || LOGOUT_PATH, logoutFactory(sessionManager))
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
