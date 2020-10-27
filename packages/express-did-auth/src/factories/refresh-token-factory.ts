import { SessionManager } from '../classes/session-manager'
import { REFRESH_TOKEN_COOKIE_NAME, ACCESS_TOKEN_COOKIE_NAME } from '../constants'
import { ErrorCodes } from '../errors'
import { generateAccessToken } from '../jwt-utils'
import { AuthenticationConfig } from '../types'

export function refreshTokenFactory (sessionManager: SessionManager, accessTokenConfig: AuthenticationConfig) {
  return async function (req, res) {
    const currentRefreshToken = accessTokenConfig.useCookies ? req.cookies[REFRESH_TOKEN_COOKIE_NAME] : req.body.refreshToken

    if (!currentRefreshToken) return res.status(401).send(ErrorCodes.NO_REFRESH_TOKEN)

    const newUserSession = sessionManager.renew(currentRefreshToken)

    if (!newUserSession) {
      return res.status(401).send(ErrorCodes.INVALID_OR_EXPIRED_SESSION)
    }

    const { refreshToken, did, metadata } = newUserSession
    const accessToken = await generateAccessToken(did, accessTokenConfig, metadata)

    if (accessTokenConfig.useCookies) {
      const cookiesAttributes = { httpOnly: true, sameSite: 'Strict', secure: true }

      res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, cookiesAttributes)
      res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, cookiesAttributes)

      return res.status(200).send()
    }

    return res.status(200).json({ accessToken, refreshToken })
  }
}
