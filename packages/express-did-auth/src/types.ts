import { JWTPayload, Signer } from 'did-jwt'
import { VerifiableCredential } from 'did-jwt-vc'

export interface ChallengeVerifier {
  get(did: string): string
  verify(did: string, challenge: string): boolean
}

export interface RequestCounter {
  count(did): void
}

export interface Claim {
  claimType: string
  claimValue: string
  reason?: string
  essential?: boolean
}

export interface SelectiveDisclosureRequest extends JWTPayload {
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

export interface ExpressDidAuthConfig extends TokenConfig, ChallengeConfig, RequestCounterConfig, SignupConfig {
  includeSignup?: boolean
  requestSignupPath?: string
  signupPath?: string
  requestAuthPath?: string
  authPath?: string
  logoutPath?: string
  authenticationBusinessLogic?: AuthenticationBusinessLogic
}

export interface SignupConfig {
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

export interface TokenConfig extends AccessTokenOptions {
  useCookies?: boolean
}

export interface AccessTokenOptions {
  accessTokenExpirationTimeInSeconds?: number
  serviceDid: string
  serviceUrl: string
  signer: Signer
}

export interface ChallengeResponsePayload extends JWTPayload {
  challenge: string
  sdr?: SelectiveDisclosureResponse
}

export type InternalBusinessLogic = (payload: ChallengeResponsePayload) => Promise<boolean>

export type AuthenticationBusinessLogic = (did: string) => Promise<boolean>

export type SignupBusinessLogic = (did: string, sdr?: SelectiveDisclosureResponse) => Promise<boolean>
