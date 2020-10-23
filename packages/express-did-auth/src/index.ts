import { Express } from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import { ExpressDidAuthConfig } from './types'
import ChallengeVerifierImplementation from './classes/challenge-verifier'
import RequestCounterImplementation from './classes/request-counter'
import SessionManagerImplementation from './classes/session-manager'
import authenticationFactory from './factories/authentication-factory'
import expressMiddlewareFactory from './factories/express-middleware-factory'
import logoutFactory from './factories/logout-factory'
import refreshTokenFactory from './factories/refresh-token-factory'
import requestAuthFactory from './factories/request-auth-factory'
import requestSignupFactory from './factories/request-signup-factory'
import {
  DEFAULT_AUTH, DEFAULT_LOGOUT, DEFAULT_REFRESH_TOKEN,
  DEFAULT_REQUEST_AUTH, DEFAULT_REQUEST_SIGNUP, DEFAULT_SIGNUP
} from './constants'
import { generateAccessToken, verifyAccessToken } from './jwt-utils'

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
      app.get(requestSignupPath || DEFAULT_REQUEST_SIGNUP, requestSignupFactory(challengeVerifier, config))

      app.post(signupPath || DEFAULT_SIGNUP, authenticationFactory(challengeVerifier, sessionManager, config, config.signupBusinessLogic))
    }

    app.get(requestAuthPath || DEFAULT_REQUEST_AUTH, requestAuthFactory(challengeVerifier))

    app.post(authPath || DEFAULT_AUTH, authenticationFactory(challengeVerifier, sessionManager, config, config.authenticationBusinessLogic))

    app.post(refreshTokenPath || DEFAULT_REFRESH_TOKEN, refreshTokenFactory(sessionManager, config))

    app.use(expressMiddlewareFactory(requestCounter, config))

    app.post(logoutPath || DEFAULT_LOGOUT, logoutFactory(sessionManager))
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
  verifyAccessToken
}
