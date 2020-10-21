import requestAuthFactory from '../src/factories/request-auth-factory'
import ChallengeVerifier from '../src/classes/challenge-verifier'
import { mockedResFactory } from './utils'
import MockDate from 'mockdate'
import { ErrorCodes } from '../src/errors'

describe('requestAuthFactory', () => {
  const did = 'did:ethr:rsk:testnet:0xd69ced736454347be68aead53fcc1678cb9a70ef'
  const challengeSecret = 'theSecret'
  const challengeExpirationTimeInSeconds = 100

  const modulo0Timestamp = 1603300440000 // modulo0Timestamp % (challengeExpirationTimeInSeconds * 1000) = 0 secs
  
  const challengeVerifier = new ChallengeVerifier({ challengeSecret, challengeExpirationTimeInSeconds })

  it('should return a 200 with the created challenge', () => {
    MockDate.set(modulo0Timestamp)

    const challenge = challengeVerifier.get(did)

    const res = mockedResFactory(200, { challenge })
    const req = { params: { did } }

    requestAuthFactory(challengeVerifier)(req, res)
  })

  it('should return a 401 if no did', () => {
    const res = mockedResFactory(401, ErrorCodes.INVALID_DID)
    const req = { params: { } }

    requestAuthFactory(challengeVerifier)(req, res)
  })
})
