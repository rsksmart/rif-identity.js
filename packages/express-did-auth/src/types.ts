import { JWTPayload, Signer } from 'did-jwt'
import { VerifiableCredential } from 'did-jwt-vc'
import { CredentialRequestInput } from 'daf-selective-disclosure'
import { ChallengeConfig } from './classes/challenge-verifier'
import { RequestCounterConfig } from './classes/request-counter'
import { UserSessionConfig } from './classes/session-manager'

export interface SelectiveDisclosureResponse {
  issuer: string
  subject: string
  claims?: CredentialRequestInput[]
  credentials: VerifiableCredential[]
}

export interface ExpressDidAuthConfig extends ChallengeConfig, RequestCounterConfig, SignupConfig, AuthenticationConfig, UserSessionConfig {
  requestSignupPath?: string
  signupPath?: string
  requestAuthPath?: string
  authPath?: string
  logoutPath?: string
  refreshTokenPath?: string
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
