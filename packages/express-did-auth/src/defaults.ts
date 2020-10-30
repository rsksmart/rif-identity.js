export const CHALLENGE_EXPIRATION_TIME = 5 * 60 * 1000 // 5 mins
export const MAX_REQUESTS_PER_TIME_SLOT = 20
export const REQUEST_COUNTER_TIME_SLOT = 10 * 60 * 1000 // 10 mins
export const USER_SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // one week
export const ACCESS_TOKEN_EXPIRATION = 10 * 60 * 1000 // 10 mins

// default routes
export const REQUEST_SIGNUP_PATH = '/request-signup/:did'
export const SIGNUP_PATH = '/signup'
export const REQUEST_AUTH_PATH = '/request-auth/:did'
export const AUTH_PATH = '/auth'
export const LOGOUT_PATH = '/logout'
export const REFRESH_TOKEN_PATH = '/refresh-token'
