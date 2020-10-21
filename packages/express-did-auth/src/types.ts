import { JWTPayload, Signer } from 'did-jwt'
import { VerifiableCredential } from 'did-jwt-vc'

export interface ChallengeVerifier {
  get(did: string): string
  verify(did: string, challenge: string): boolean
}

export interface RequestCounter {
  count(did): void
}

export interface SessionManager {
  create(did: string): string
  renew(oldToken: string): { refreshToken: string, did: string, metadata: any }
  delete(did: string): void
}

export interface Claim {
  claimType: string
  claimValue: string
  reason?: string
  essential?: boolean
}

export interface SelectiveDisclosureRequest {
  issuer: string
  subject: string
  replyUrl?: string
  claims?: Claim[]
  credentials?: string[]
}

export interface SelectiveDisclosureResponse {
  issuer: string
  subject: string
  claims?: Claim[]
  credentials: VerifiableCredential[]
}

export interface ExpressDidAuthConfig extends TokenConfig, ChallengeConfig, RequestCounterConfig, SignupConfig, AccessTokenOptions, UserSessionConfig {
  includeSignup?: boolean
  requestSignupPath?: string
  signupPath?: string
  requestAuthPath?: string
  authPath?: string
  logoutPath?: string
  refreshTokenPath?: string
  authenticationBusinessLogic?: AuthenticationBusinessLogic
}

export interface UserSessionConfig {
  userSessionDurationInHours?: number
}

export interface SignupConfig extends TokenConfig {
  requiredCredentials?: string[] 
  requiredClaims?: Claim[]
  signupBusinessLogic?: SignupBusinessLogic
}

export interface RequestCounterConfig {
  maxRequestsPerTimeSlot?: number
  timeSlotInSeconds?: number
}

export interface ChallengeConfig {
  challengeExpirationTimeInSeconds?: number
  challengeSecret: string
}

export interface TokenConfig {
  useCookies?: boolean
  serviceDid: string
  serviceUrl: string
  signer: Signer
}

export interface AccessTokenOptions extends TokenConfig {
  accessTokenExpirationTimeInSeconds?: number
}

export interface ChallengeResponsePayload extends JWTPayload {
  challenge: string
  sdr?: SelectiveDisclosureResponse
}

export type InternalBusinessLogic = (payload: ChallengeResponsePayload) => Promise<boolean>

export type AuthenticationBusinessLogic = (did: string) => Promise<boolean>

export type SignupBusinessLogic = (did: string, sdr?: SelectiveDisclosureResponse) => Promise<boolean>
