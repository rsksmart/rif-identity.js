import { ErrorCodes } from '../errors'
import { keccak256 } from 'js-sha3'
import { CHALLENGE_EXPIRATION_TIME } from '../defaults'

export interface ChallengeConfig {
  challengeExpirationTimeInSeconds?: number
  challengeSecret: string
}

export interface ChallengeVerifier {
  get(did: string): string
  verify(did: string, challenge: string): boolean
}

export default class implements ChallengeVerifier {
  private expirationTimeInSeconds: number
  private secret: string

  constructor ({ challengeExpirationTimeInSeconds, challengeSecret }: ChallengeConfig) {
    this.expirationTimeInSeconds = challengeExpirationTimeInSeconds || CHALLENGE_EXPIRATION_TIME
    this.secret = challengeSecret
  }

  get (did: string): string {
    if (!did) throw new Error(ErrorCodes.INVALID_DID)

    return this.calculateChallenge(did)
  }

  verify (did: string, challenge: string): boolean {
    if (!did) throw new Error(ErrorCodes.INVALID_DID)

    const expected = this.calculateChallenge(did)

    if (expected !== challenge) return false

    return true
  }

  private calculateChallenge (did: string) {
    const timestamp = Math.floor(Date.now() / (this.expirationTimeInSeconds * 1000))

    return keccak256(`${did}-${this.secret}-${timestamp}`)
  }
}
