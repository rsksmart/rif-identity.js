import { SessionManager } from '../classes/session-manager'
import { REFRESH_TOKEN_COOKIE_NAME, ACCESS_TOKEN_COOKIE_NAME, COOKIES_ATTRIBUTES } from '../constants'
import { INVALID_OR_EXPIRED_SESSION, NO_REFRESH_TOKEN } from '../errors'
import { generateAccessToken } from '../jwt-utils'
import { AuthenticationConfig } from '../types'

export function refreshTokenFactory (sessionManager: SessionManager, accessTokenConfig: AuthenticationConfig) {
  return async function (req, res) {
    const currentRefreshToken = accessTokenConfig.useCookies ? req.cookies[REFRESH_TOKEN_COOKIE_NAME] : req.body.refreshToken

    if (!currentRefreshToken) return res.status(401).send(NO_REFRESH_TOKEN)

    const newUserSession = sessionManager.renew(currentRefreshToken)

    if (!newUserSession) return res.status(401).send(INVALID_OR_EXPIRED_SESSION)

    const { refreshToken, did, metadata } = newUserSession
    const accessToken = await generateAccessToken(did, accessTokenConfig, metadata)

    if (!accessTokenConfig.useCookies) return res.status(200).json({ accessToken, refreshToken })

    res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, COOKIES_ATTRIBUTES)
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, COOKIES_ATTRIBUTES)

    return res.status(200).send()
  }
}
