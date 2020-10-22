import { REFRESH_TOKEN_COOKIE_NAME, ACCESS_TOKEN_COOKIE_NAME } from '../constants'
import { ErrorCodes } from '../errors'
import { generateAccessToken } from '../jwt-helpers'
import { AuthenticationConfig, SessionManager } from '../types'

export default function refreshTokenFactory (sessionManager: SessionManager, accessTokenConfig: AuthenticationConfig) {
  return function (req, res) {
    let currentRefreshToken: string
    if (accessTokenConfig.useCookies) {
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
    const accessToken = generateAccessToken(did, accessTokenConfig, metadata)

    if (accessTokenConfig.useCookies) {
      const cookiesAttributes = { httpOnly: true, sameSite: 'Strict', secure: true }

      res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, cookiesAttributes)
      res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, cookiesAttributes)

      return res.status(200).send()
    }

    return res.status(200).json({ accessToken, refreshToken })
  }
}
