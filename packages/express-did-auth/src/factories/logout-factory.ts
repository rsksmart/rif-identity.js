import { AppState, TokenValidationConfig } from '../types'
import { setCookies } from './cookies'

export function logoutFactory (state: AppState, config: TokenValidationConfig) {
  // this function assumes it is invoked after a middleware that injects the user did in the request object
  return function (req, res) {
    const refreshToken = state.sessions[req.user.did]?.sessionManager.getCurrentRefreshToken()
    delete state.refreshTokens[refreshToken]
    delete state.sessions[req.user.did]

    if (config.useCookies) setCookies(res, req.user.did, '', '', true)

    return res.status(200).send()
  }
}
