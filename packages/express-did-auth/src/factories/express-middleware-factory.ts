import { JWTPayload } from 'did-jwt'
import { ACCESS_TOKEN_COOKIE_NAME, ACCESS_TOKEN_HEADER_NAME, DID_AUTH_SCHEME } from '../constants'
import { INVALID_HEADER, NO_ACCESS_TOKEN, UNHANDLED_ERROR } from '../errors'
import { verifyReceivedJwt } from '../jwt-utils'
import { AppState, TokenValidationConfig } from '../types'

export function expressMiddlewareFactory (state: AppState, config: TokenValidationConfig) {
  return async function (req, res, next) {
    try {
      let jwt: string
      if (config.useCookies) {
        jwt = req.cookies[ACCESS_TOKEN_COOKIE_NAME]
      } else {
        const header = req.headers[ACCESS_TOKEN_HEADER_NAME] || req.headers[ACCESS_TOKEN_HEADER_NAME.toLowerCase()]
        if (!header) return res.status(401).send(NO_ACCESS_TOKEN)

        const [scheme, token] = header.split(' ')
        if (scheme !== DID_AUTH_SCHEME) {
          return res.status(401).send(INVALID_HEADER)
        }

        jwt = token
      }

      if (!jwt) return res.status(401).send(NO_ACCESS_TOKEN)

      const verified = await verifyReceivedJwt(jwt, config)
      const payload = verified.payload as JWTPayload
      const did = payload.sub

      state.sessions[did].requestCounter.count()

      req.user = { did }

      next()
    } catch (err) {
      if (err?.message) return res.status(401).send(escape(err.message))
      return res.status(500).send(UNHANDLED_ERROR)
    }
  }
}
