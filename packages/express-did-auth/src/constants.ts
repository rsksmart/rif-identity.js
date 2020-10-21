export const ACCESS_TOKEN_COOKIE_NAME = 'authorization'
export const REFRESH_TOKEN_COOKIE_NAME = 'refresh-token'
export const ACCESS_TOKEN_HEADER_NAME = 'Authorization'

export const DEFAULT_CHALLENGE_EXPIRATION_TIME = 5 * 60 // seconds
export const DEFAULT_MAX_REQUESTS_PER_TIME_SLOT = 20
export const DEFAULT_REQUEST_COUNTER_TIME_SLOT = 10 * 60 // seconds
export const DEFAULT_USER_SESSION_DURATION = 7 * 24 // hours

// default routes
export const DEFAULT_REQUEST_SIGNUP = '/request-signup/:did'
export const DEFAULT_SIGNUP = '/signup'
export const DEFAULT_REQUEST_AUTH = '/request-auth/:did'
export const DEFAULT_AUTH = '/auth'
export const DEFAULT_LOGOUT = '/logout'
export const DEFAULT_REFRESH_TOKEN = '/refresh-token'