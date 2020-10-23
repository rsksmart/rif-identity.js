import { JWTPayload } from 'did-jwt'
import { RequestCounter } from '../classes/request-counter'
import { ACCESS_TOKEN_COOKIE_NAME, ACCESS_TOKEN_HEADER_NAME, DID_AUTH_SCHEME } from '../constants'
import { ErrorCodes } from '../errors'
import { verifyReceivedJwt } from '../jwt-utils'
import { TokenValidationConfig } from '../types'

export default function expressMiddlewareFactory (requestCounter: RequestCounter, config: TokenValidationConfig) {
  return async function (req, res, next) {
    try {
      let jwt: string
      if (config.useCookies) {
        jwt = req.cookies[ACCESS_TOKEN_COOKIE_NAME]
      } else {
        const header = req.headers[ACCESS_TOKEN_HEADER_NAME] || req.headers[ACCESS_TOKEN_HEADER_NAME.toLowerCase()]
        if (!header) return res.status(401).send(ErrorCodes.NO_ACCESS_TOKEN)

        const [scheme, token] = header.split(' ')
        if (scheme !== DID_AUTH_SCHEME) {
          return res.status(401).send(ErrorCodes.INVALID_HEADER)
        }

        jwt = token
      }

      if (!jwt) return res.status(401).send(ErrorCodes.NO_ACCESS_TOKEN)

      const verified = await verifyReceivedJwt(jwt, config)
      const payload = verified.payload as JWTPayload
      const did = payload.sub

      requestCounter.count(did)

      req.user = { did }

      next()
    } catch (err) {
      if (err?.message) return res.status(401).send(escape(err.message))
      return res.status(500).send(ErrorCodes.UNHANDLED_ERROR)
    }
  }
}
