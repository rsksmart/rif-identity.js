import requestSignupFactory from '../src/factories/request-signup-factory'
import ChallengeVerifier from '../src/classes/challenge-verifier'
import { identityFactory, mockedResFactory, modulo0Timestamp } from './utils'
import MockDate from 'mockdate'
import { ErrorCodes } from '../src/errors'
import { createJWT, Signer } from 'did-jwt'
import { Claim, SelectiveDisclosureRequest, SignupConfig } from '../src/types'

describe('requestSignupFactory', () => {
  const userDid = 'did:ethr:rsk:testnet:0xd69ced736454347be68aead53fcc1678cb9a70ef'
  
  const challengeSecret = 'theSecret'
  const challengeExpirationTimeInSeconds = 60
  const challengeVerifier = new ChallengeVerifier({ challengeSecret, challengeExpirationTimeInSeconds })

  let serviceDid: string
  let serviceSigner: Signer
  const serviceUrl = 'https://the.service.com'
  
  beforeAll(async () => {
    const serviceIdentity = await identityFactory()
    serviceDid = serviceIdentity.did
    serviceSigner = serviceIdentity.signer
  })
  
  it('should return a 200 with the created challenge if no sdr', async () => {
    MockDate.set(modulo0Timestamp)

    const challenge = challengeVerifier.get(userDid)

    const res = mockedResFactory(200, { challenge })
    const req = { params: { did: userDid } }

    await requestSignupFactory(challengeVerifier, { serviceSigner, serviceDid, serviceUrl } )(req, res)
  })

  it('should return a 200 with a the created challenge and sdr when sdr present in the config', async () => {
    MockDate.set(modulo0Timestamp)
    
    const requiredCredentials = ['EmailCredential']
    const requiredClaims: Claim[] = [{ claimType: 'name' }]

    const sdrData: SelectiveDisclosureRequest = {
      subject: userDid,
      issuer: serviceDid, 
      credentials: requiredCredentials,
      claims: requiredClaims
    }

    const sdr = await createJWT(
      { type: 'sdr', ...sdrData },
      { signer: serviceSigner, issuer: serviceDid },
      { typ: 'JWT', alg: 'ES256K' }
    )

    const challenge = challengeVerifier.get(userDid)

    const res = mockedResFactory(200, { challenge, sdr })
    const req = { params: { did: userDid } }

    const config: SignupConfig = {
      serviceSigner, serviceDid, serviceUrl, requiredCredentials, requiredClaims
    }
    await requestSignupFactory(challengeVerifier, config)(req, res)
  })

  it('should return a 401 if no did', async () => {
    const res = mockedResFactory(401, ErrorCodes.INVALID_DID)
    const req = { params: { } }

    await requestSignupFactory(challengeVerifier, { serviceSigner, serviceDid, serviceUrl })(req, res)
  })
})
