import { JWTPayload, Signer } from 'did-jwt'
import { CredentialRequestInput } from 'daf-selective-disclosure'
import { RequestCounter } from './classes/request-counter'
import { SessionManager } from './classes/session-manager'

export interface AppState {
  sessions: DidSessionStateMapping
  refreshTokens: RefreshTokenDidMapping
}

interface DidSessionStateMapping {
  [did: string]: UserState
}

interface RefreshTokenDidMapping {
  [refreshToken: string]: string
}

export interface UserState {
  requestCounter: RequestCounter
  sessionManager: SessionManager
}

interface SelectiveDisclosureResponseEntry {
  [key: string]: string
}

export interface SelectiveDisclosureResponse {
  claims: SelectiveDisclosureResponseEntry
  credentials: SelectiveDisclosureResponseEntry
}

export interface ExpressDidAuthConfig extends SignupConfig {
  requestSignupPath?: string
  signupPath?: string
  requestAuthPath?: string
  authPath?: string
  logoutPath?: string
  refreshTokenPath?: string
  challengeExpirationTimeInSeconds?: number
  challengeSecret: string
  accessTokenExpirationTimeInSeconds?: number
  loginMessageHeader?: string
  authenticationBusinessLogic?: AuthenticationBusinessLogic
  maxRequestsPerTimeSlot?: number
  timeSlotInSeconds?: number
  userSessionDurationInHours?: number
}

export interface DidResolverConfig {
  rpcUrl?: string
  networkName?: string
  registry?: string
}

export interface TokenValidationConfig extends DidResolverConfig {
  serviceUrl: string
  useCookies?: boolean
  allowMultipleSessions?: boolean
  serviceDid: string
}

export interface TokenConfig extends TokenValidationConfig {
  serviceSigner: Signer
}

export interface SignupConfig extends TokenConfig {
  requiredCredentials?: string[]
  requiredClaims?: CredentialRequestInput[]
  signupBusinessLogic?: SignupBusinessLogic
}

export interface ChallengeResponsePayload extends JWTPayload {
  challenge: string
}

export interface SignupChallengeResponsePayload {
  did: string
  sd?: SelectiveDisclosureResponse
}

export type AuthenticationBusinessLogic = (payload: ChallengeResponsePayload) => Promise<boolean>

export type SignupBusinessLogic = (payload: SignupChallengeResponsePayload) => Promise<boolean>

export interface AuthenticationConfig extends TokenConfig {
  accessTokenExpirationTime?: number
  loginMessageHeader?: string
}
