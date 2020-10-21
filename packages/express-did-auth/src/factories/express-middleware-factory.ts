import { verifyJWT, JWTPayload } from 'did-jwt'
import { ACCESS_TOKEN_COOKIE_NAME, ACCESS_TOKEN_HEADER_NAME } from '../constants'
import { ErrorCodes } from '../errors'
import { TokenConfig, RequestCounter } from '../types'

export default function expressMiddlewareFactory(tokenOptions: TokenConfig, requestCounter: RequestCounter) {
  return async function expressMiddleware(req, res, next) {
    try {
      let jwt: string
      if (tokenOptions.useCookies) {
        jwt = req.cookies[ACCESS_TOKEN_COOKIE_NAME]
      } else {
        jwt = req.headers[ACCESS_TOKEN_HEADER_NAME]
      }

      if (!jwt) return res.status(401).send(ErrorCodes.NO_ACCESS_TOKEN)

      const verified = await verifyJWT(jwt, { audience: tokenOptions.serviceUrl })

      const payload = verified.payload as JWTPayload

      const now = Math.floor(Date.now() / 1000)

      if (payload.exp < now) res.status(401).send(ErrorCodes.EXPIRED_ACCESS_TOKEN)
      if (payload.nbf > now) res.status(401).send(ErrorCodes.INVALID_ACCESS_TOKEN)
      
      const did = payload.sub
      
      requestCounter.count(did)

      req.user = { did }

      next()
    } catch (err) {
      if (err?.message) {
        res.status(401).send(err.message)
      } else {
        res.status(500).send(ErrorCodes.UNHANDLED_ERROR)
      }
    }
  }
}