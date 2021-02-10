import { REFRESH_TOKEN_COOKIE_NAME, ACCESS_TOKEN_COOKIE_NAME, COOKIES_ATTRIBUTES } from '../constants'

export function setCookies (res: any, did: string, accessToken: string, refreshToken: string, expires = false) {
  const accessTokenCookieName = `${ACCESS_TOKEN_COOKIE_NAME}-${did}`
  const refreshCookieName = `${REFRESH_TOKEN_COOKIE_NAME}-${did}`

  const attributes = !expires ? COOKIES_ATTRIBUTES : { ...COOKIES_ATTRIBUTES, expires: new Date(Date.now() + 1000) }

  res.cookie(accessTokenCookieName, accessToken, attributes)
  res.cookie(refreshCookieName, refreshToken, attributes)
}
