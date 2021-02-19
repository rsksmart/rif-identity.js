import { REFRESH_TOKEN_COOKIE_NAME, LOGGED_DID_COOKIE_NAME } from '../constants'
import { INVALID_OR_EXPIRED_SESSION, NO_REFRESH_TOKEN } from '../errors'
import { generateAccessToken } from '../jwt-utils'
import { AppState, AuthenticationConfig } from '../types'
import { setCookies } from './cookies'

function extractRefreshToken (req, useCookies: boolean) {
  if (!useCookies) return req.body.refreshToken

  const did = req.headers[LOGGED_DID_COOKIE_NAME]
  return req.cookies[`${REFRESH_TOKEN_COOKIE_NAME}-${did}`]
}

export function refreshTokenFactory (state: AppState, accessTokenConfig: AuthenticationConfig) {
  return async function (req, res) {
    try {
      const { useCookies } = accessTokenConfig
      const oldRefreshToken = extractRefreshToken(req, useCookies)

      if (!oldRefreshToken) return res.status(401).send(NO_REFRESH_TOKEN)

      const did = state.refreshTokens[oldRefreshToken]
      delete state.refreshTokens[oldRefreshToken] // delete old refresh token from the state

      if (!did) return res.status(401).send(INVALID_OR_EXPIRED_SESSION)

      const newUserSession = state.sessions[did].sessionManager.renewRefreshToken(oldRefreshToken)

      if (!newUserSession) return res.status(401).send(INVALID_OR_EXPIRED_SESSION)

      const { refreshToken, metadata } = newUserSession
      state.refreshTokens[refreshToken] = did // adds new refresh token to the state
      const accessToken = await generateAccessToken(did, accessTokenConfig, metadata)

      if (!useCookies) return res.status(200).json({ accessToken, refreshToken })

      setCookies(res, did, accessToken, refreshToken)

      return res.status(200).send()
    } catch (err) {
      if (err.message) return res.status(401).send(escape(err.message))
      return res.status(401).send('Unhandled error')
    }
  }
}
