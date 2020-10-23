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
  claimValue?: string
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

export interface ExpressDidAuthConfig extends ChallengeConfig, RequestCounterConfig, SignupConfig, AuthenticationConfig, UserSessionConfig {
  includeSignup?: boolean
  requestSignupPath?: string
  signupPath?: string
  requestAuthPath?: string
  authPath?: string
  logoutPath?: string
  refreshTokenPath?: string
}

export interface UserSessionConfig {
  userSessionDurationInHours?: number
}

export interface RequestCounterConfig {
  maxRequestsPerTimeSlot?: number
  timeSlotInSeconds?: number
}

export interface ChallengeConfig {
  challengeExpirationTimeInSeconds?: number
  challengeSecret: string
}

export interface DidResolverConfig {
  rpcUrl?: string
  networkName?: string
  registry?: string
}

export interface TokenValidationConfig extends DidResolverConfig {
  serviceUrl: string
  useCookies?: boolean
}

export interface TokenConfig extends TokenValidationConfig {
  serviceDid: string
  serviceSigner: Signer
}

export interface AuthenticationConfig extends TokenConfig {
  accessTokenExpirationTimeInSeconds?: number
  authenticationBusinessLogic?: AuthenticationBusinessLogic
}

export interface SignupConfig extends TokenConfig {
  requiredCredentials?: string[]
  requiredClaims?: Claim[]
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
