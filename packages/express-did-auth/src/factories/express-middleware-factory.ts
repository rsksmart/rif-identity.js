import { JWTPayload } from 'did-jwt'
import { ACCESS_TOKEN_COOKIE_NAME, ACCESS_TOKEN_HEADER_NAME, DID_AUTH_SCHEME } from '../constants'
import { CORRUPTED_ACCESS_TOKEN, INVALID_HEADER, NO_ACCESS_TOKEN, UNHANDLED_ERROR } from '../errors'
import { verifyReceivedJwt } from '../jwt-utils'
import { AppState, TokenValidationConfig } from '../types'

function extractAccessToken (req, useCookies: boolean) {
  if (useCookies) return req.cookies[ACCESS_TOKEN_COOKIE_NAME]

  const header = req.headers[ACCESS_TOKEN_HEADER_NAME] || req.headers[ACCESS_TOKEN_HEADER_NAME.toLowerCase()]
  if (!header) throw new Error(NO_ACCESS_TOKEN)

  const [scheme, token] = header.split(' ')
  if (scheme !== DID_AUTH_SCHEME) throw new Error(INVALID_HEADER)

  return token
}

export function expressMiddlewareFactory (state: AppState, config: TokenValidationConfig) {
  return async function (req, res, next) {
    try {
      const jwt = extractAccessToken(req, config.useCookies)

      if (!jwt) return res.status(401).send(NO_ACCESS_TOKEN)

      const verified = await verifyReceivedJwt(jwt, config)
      if (verified.issuer !== config.serviceDid) return res.status(401).send(CORRUPTED_ACCESS_TOKEN)

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
