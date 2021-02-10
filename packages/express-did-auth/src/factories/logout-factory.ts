import { ACCESS_TOKEN_COOKIE_NAME, COOKIES_ATTRIBUTES, REFRESH_TOKEN_COOKIE_NAME } from '../constants'
import { AppState, TokenValidationConfig } from '../types'

export function logoutFactory (state: AppState, config: TokenValidationConfig) {
  // this function assumes it is invoked after a middleware that injects the user did in the request object
  return function (req, res) {
    const refreshToken = state.sessions[req.user.did]?.sessionManager.getCurrentRefreshToken()
    delete state.refreshTokens[refreshToken]
    delete state.sessions[req.user.did]

    const { useCookies } = config

    if (useCookies) {
      const accessTokenCookieName = `${ACCESS_TOKEN_COOKIE_NAME}-${req.user.did}`
      const refreshCookieName = `${REFRESH_TOKEN_COOKIE_NAME}-${req.user.did}`

      const expires = new Date(Date.now() + 1000)
      res.cookie(accessTokenCookieName, '', { ...COOKIES_ATTRIBUTES, expires })
      res.cookie(refreshCookieName, '', { ...COOKIES_ATTRIBUTES, expires })
    }

    return res.status(200).send()
  }
}
