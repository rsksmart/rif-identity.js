import { INVALID_DID } from '../errors'
import { keccak256 } from 'js-sha3'
import { CHALLENGE_EXPIRATION_TIME } from '../defaults'

export interface ChallengeConfig {
  challengeExpirationTime?: number
  challengeSecret: string
}

export class ChallengeVerifier {
  private expirationTime: number
  private secret: string

  constructor ({ challengeExpirationTime, challengeSecret }: ChallengeConfig) {
    this.expirationTime = challengeExpirationTime || CHALLENGE_EXPIRATION_TIME
    this.secret = challengeSecret
  }

  get (did: string): string {
    if (!did) throw new Error(INVALID_DID)

    return this.calculateChallenge(did)
  }

  verify (did: string, challenge: string): boolean {
    if (!did) throw new Error(INVALID_DID)

    const expected = this.calculateChallenge(did)

    if (expected !== challenge) return false

    return true
  }

  private calculateChallenge (did: string) {
    const timestamp = Math.floor(Date.now() / this.expirationTime)

    return keccak256(`${did}-${this.secret}-${timestamp}`)
  }
}
