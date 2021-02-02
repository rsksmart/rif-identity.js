import { ChallengeConfig } from './classes/challenge-verifier'
import { RequestCounterConfig } from './classes/request-counter'
import { UserSessionConfig } from './classes/session-manager'
import { ExpressDidAuthConfig, AuthenticationConfig } from './types'

export const adaptToChallengeConfig = (config: ExpressDidAuthConfig): ChallengeConfig => {
  const { challengeExpirationTimeInSeconds, challengeSecret } = config
  const challengeExpirationTime = challengeExpirationTimeInSeconds && challengeExpirationTimeInSeconds * 1000

  return { challengeSecret, challengeExpirationTime }
}

export const adaptToAuthFactoryConfig = (config: ExpressDidAuthConfig): AuthenticationConfig => {
  const {
    useCookies,
    allowMultipleSessions,
    serviceDid,
    serviceSigner,
    serviceUrl,
    rpcUrl,
    networkName,
    registry,
    accessTokenExpirationTimeInSeconds,
    loginMessageHeader
  } = config
  const accessTokenExpirationTime = accessTokenExpirationTimeInSeconds && accessTokenExpirationTimeInSeconds * 1000

  return {
    accessTokenExpirationTime,
    useCookies,
    allowMultipleSessions,
    serviceDid,
    serviceSigner,
    serviceUrl,
    rpcUrl,
    networkName,
    registry,
    loginMessageHeader
  }
}

export const adaptToRequestCounterConfig = (config: ExpressDidAuthConfig): RequestCounterConfig => {
  const { maxRequestsPerTimeSlot, timeSlotInSeconds } = config
  const timeSlot = timeSlotInSeconds && timeSlotInSeconds * 1000

  return { timeSlot, maxRequestsPerTimeSlot }
}

export const adaptToUserSessionConfig = (config: ExpressDidAuthConfig): UserSessionConfig => {
  const { userSessionDurationInHours } = config
  const userSessionDuration = userSessionDurationInHours && userSessionDurationInHours * 60 * 60 * 1000

  return { userSessionDuration }
}
