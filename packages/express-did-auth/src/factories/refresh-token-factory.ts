import { REFRESH_TOKEN_COOKIE_NAME, ACCESS_TOKEN_COOKIE_NAME, COOKIES_ATTRIBUTES } from '../constants'
import { INVALID_OR_EXPIRED_SESSION, NO_REFRESH_TOKEN } from '../errors'
import { generateAccessToken } from '../jwt-utils'
import { AppState, AuthenticationConfig } from '../types'

export function refreshTokenFactory (state: AppState, accessTokenConfig: AuthenticationConfig) {
  return async function (req, res) {
    try {
      const oldRefreshToken = accessTokenConfig.useCookies ? req.cookies[REFRESH_TOKEN_COOKIE_NAME] : req.body.refreshToken

      if (!oldRefreshToken) return res.status(401).send(NO_REFRESH_TOKEN)

      const did = state.refreshTokens[oldRefreshToken]
      delete state.refreshTokens[oldRefreshToken] // delete old refresh token from the state

      if (!did) return res.status(401).send(INVALID_OR_EXPIRED_SESSION)

      const newUserSession = state.sessions[did].sessionManager.renewRefreshToken(oldRefreshToken)

      if (!newUserSession) return res.status(401).send(INVALID_OR_EXPIRED_SESSION)

      const { refreshToken, metadata } = newUserSession
      state.refreshTokens[refreshToken] = did // adds new refresh token to the state
      const accessToken = await generateAccessToken(did, accessTokenConfig, metadata)

      if (!accessTokenConfig.useCookies) return res.status(200).json({ accessToken, refreshToken })

      res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, COOKIES_ATTRIBUTES)
      res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, COOKIES_ATTRIBUTES)

      return res.status(200).send()
    } catch (err) {
      if (err.message) return res.status(401).send(escape(err.message))
      return res.status(401).send('Unhandled error')
    }
  }
}
