import { JWTPayload, Signer } from 'did-jwt'
import { VerifiableCredential } from 'did-jwt-vc'
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

export interface SelectiveDisclosureResponse {
  issuer: string
  subject: string
  claims?: CredentialRequestInput[]
  credentials: VerifiableCredential[]
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

export interface SignupChallengeResponsePayload extends ChallengeResponsePayload {
  sdr?: SelectiveDisclosureResponse
}

export type AuthenticationBusinessLogic = (payload: ChallengeResponsePayload) => Promise<boolean>

export type SignupBusinessLogic = (payload: SignupChallengeResponsePayload) => Promise<boolean>

export interface AuthenticationConfig extends TokenConfig {
  accessTokenExpirationTime?: number
}
