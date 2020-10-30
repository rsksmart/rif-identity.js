import { AppState } from '../types'

export function logoutFactory (state: AppState) {
  // this function assumes it is invoked after a middleware that injects the user did in the request object
  return function (req, res) {
    const refreshToken = state.sessions[req.user.did]?.sessionManager.getCurrentRefreshToken()
    delete state.refreshTokens[refreshToken]
    delete state.sessions[req.user.did]

    return res.status(200).send()
  }
}
