import { ErrorCodes } from '../src/errors'
import ChallengeVerifier from '../src/classes/challenge-verifier'
import MockDate from 'mockdate'
import { keccak256 } from 'js-sha3'
import {
  modulo0Timestamp, modulo8Timestamp, otherSlotTimestamp, modulo59Timestamp
} from './utils'

describe('ChallengeVerifier', () => {
  const challengeSecret = 'theSecret'
  const challengeExpirationTimeInSeconds = 60

  const did = 'did:ethr:rsk:testnet:0xce83da2a364f37e44ec1a17f7f453a5e24395c70'

  const calculateExpectedChallenge = (did: string, expirationTimeInSeconds: number, secret: string, currentTimestamp?: number) => {
    const now = currentTimestamp || Date.now()
    const timestamp = Math.floor(now / (expirationTimeInSeconds * 1000))
    return keccak256(`${did}-${secret}-${timestamp}`)
  }

  afterEach(() => MockDate.reset())

  describe('get', () => {
    test('should throw an error if no did', () => {
      const verifier = new ChallengeVerifier({ challengeSecret })

      expect(() => verifier.get(undefined)).toThrow(ErrorCodes.INVALID_DID)
    })

    test('should get a challenge', () => {
      const verifier = new ChallengeVerifier({ challengeSecret, challengeExpirationTimeInSeconds })

      const actual = verifier.get(did)
      expect(actual).toBeTruthy()

      const expected = calculateExpectedChallenge(did, challengeExpirationTimeInSeconds, challengeSecret)
      expect(actual).toEqual(expected)
    })

    test('should get the same challenge when invoking it within the same timeslot', () => {
      const verifier = new ChallengeVerifier({ challengeSecret, challengeExpirationTimeInSeconds })

      const firstChallengeTime = modulo0Timestamp
      MockDate.set(firstChallengeTime)

      const firstChallenge = verifier.get(did)
      expect(firstChallenge).toBeTruthy()

      const secondChallengeTime = modulo8Timestamp
      MockDate.set(secondChallengeTime)

      const secondChallenge = verifier.get(did)
      expect(secondChallenge).toBeTruthy()

      expect(firstChallenge).toEqual(secondChallenge)

      MockDate.reset()
      const expected = calculateExpectedChallenge(did, challengeExpirationTimeInSeconds, challengeSecret, firstChallengeTime)
      expect(firstChallenge).toEqual(expected)
    })

    test('should get different challenge when invoking it twice in differents timeslots', () => {
      const verifier = new ChallengeVerifier({ challengeSecret, challengeExpirationTimeInSeconds })

      const firstChallengeTime = modulo0Timestamp
      MockDate.set(firstChallengeTime)

      const firstChallenge = verifier.get(did)
      expect(firstChallenge).toBeTruthy()

      const secondChallengeTime = otherSlotTimestamp
      MockDate.set(secondChallengeTime)

      const secondChallenge = verifier.get(did)
      expect(secondChallenge).toBeTruthy()

      expect(firstChallenge).not.toEqual(secondChallenge)

      MockDate.reset()

      const expectedFirstChallenge = calculateExpectedChallenge(did, challengeExpirationTimeInSeconds, challengeSecret, firstChallengeTime)
      expect(firstChallenge).toEqual(expectedFirstChallenge)

      const expectedSecondChallenge = calculateExpectedChallenge(did, challengeExpirationTimeInSeconds, challengeSecret, secondChallengeTime)
      expect(secondChallenge).toEqual(expectedSecondChallenge)
    })
  })

  describe('verify', () => {
    test('should throw an error if no did', () => {
      const verifier = new ChallengeVerifier({ challengeSecret })

      expect(() => verifier.verify(undefined, 'theChallenge')).toThrow(ErrorCodes.INVALID_DID)
    })

    test('should respond with false if no challenge', () => {
      const verifier = new ChallengeVerifier({ challengeSecret })

      expect(verifier.verify(did, undefined)).toBe(false)
      expect(verifier.verify(did, '')).toBe(false)
    })

    test('should respond with true if valid challenge in the same time slot', () => {
      const verifier = new ChallengeVerifier({ challengeSecret, challengeExpirationTimeInSeconds })

      const challengeTime = modulo0Timestamp
      MockDate.set(challengeTime)
      const challenge = verifier.get(did)

      const verificationTime = modulo8Timestamp
      MockDate.set(verificationTime)
      const valid = verifier.verify(did, challenge)

      expect(valid).toBe(true)
    })

    test('should respond with true twice if verifying twice in the same time slot', () => {
      const verifier = new ChallengeVerifier({ challengeSecret, challengeExpirationTimeInSeconds })

      const challengeTime = modulo0Timestamp
      MockDate.set(challengeTime)
      const challenge = verifier.get(did)

      const firstVerificationTime = modulo8Timestamp
      MockDate.set(firstVerificationTime)

      expect(verifier.verify(did, challenge)).toBe(true)

      const secondVerificationTime = modulo59Timestamp
      MockDate.set(secondVerificationTime)

      expect(verifier.verify(did, challenge)).toBe(true)
    })

    test('should respond with false if verifying the received challenge in other timeslot', () => {
      const verifier = new ChallengeVerifier({ challengeSecret, challengeExpirationTimeInSeconds })

      const challengeTime = modulo0Timestamp
      MockDate.set(challengeTime)
      const challenge = verifier.get(did)

      const verificationTime = otherSlotTimestamp
      MockDate.set(verificationTime)
      const valid = verifier.verify(did, challenge)

      expect(valid).toBe(false)
    })
  })
})
