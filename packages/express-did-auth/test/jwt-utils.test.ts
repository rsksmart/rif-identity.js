import { ErrorCodes } from '../src/errors'
import { Identity, identityFactory, mockedResFactory, modulo0Timestamp, modulo8Timestamp } from './utils'
import { generateAccessToken, getDidResolver, verifyAccessToken } from '../src/jwt-utils'
import { AuthenticationConfig } from '../src/types'
import { decodeJWT, verifyJWT } from 'did-jwt'
import MockDate from 'mockdate'
import { DEFAULT_ACCESS_TOKEN_EXPIRATION } from '../src/constants'

describe('JWT Utils', () => {
  let issuerIdentity: Identity
  let subjectIdentity: Identity
  let config: AuthenticationConfig
  
  const serviceUrl = 'https://service.com'
  const resolver = getDidResolver({ serviceUrl })

  beforeAll(async () => {
    issuerIdentity = await identityFactory()
    subjectIdentity = await identityFactory()

    config = {
      serviceSigner: issuerIdentity.signer,
      serviceDid: issuerIdentity.did,
      serviceUrl
    }
  })

  describe('generateAccessToken', () => {
    it('should create a jwt without metadata', async () => {
      MockDate.set(modulo0Timestamp)
      
      const jwt = await generateAccessToken(subjectIdentity.did, config)

      const { payload } = await decodeJWT(jwt)

      // payload verification
      expect(payload.iat).toEqual(`${modulo0Timestamp / 1000}`)
      expect(payload.nbf).toEqual(`${modulo0Timestamp / 1000}`)
      expect(payload.aud).toEqual(serviceUrl)
      expect(payload.sub).toEqual(subjectIdentity.did)
      expect(payload.iss).toEqual(issuerIdentity.did)
      expect(payload.exp).toEqual(`${modulo0Timestamp / 1000 + DEFAULT_ACCESS_TOKEN_EXPIRATION}`)
      expect(payload.metada).toBeFalsy()
    })

    it('should sign with the expected alg', async () => {
      MockDate.set(modulo0Timestamp)
      
      const jwt = await generateAccessToken(subjectIdentity.did, config)

      const { signer, issuer } = await verifyJWT(jwt, { resolver, audience: serviceUrl })

      expect(signer['type']).toEqual('Secp256k1VerificationKey2018')
      expect(signer['controller']).toEqual(issuerIdentity.did)

      expect(issuer).toEqual(issuerIdentity.did)
    })

    it('should create a jwt with metadata', async () => {
      MockDate.set(modulo0Timestamp)

      const metadata = { username: 'alice' }
      const jwt = await generateAccessToken(subjectIdentity.did, config, metadata)

      const { payload } = await decodeJWT(jwt)

      expect(payload.username).toEqual(metadata.username)
    })
  })

  describe('verifyAccessToken', () => {
    it('should verify a valid jwt', async () => {
      MockDate.set(modulo0Timestamp)
      
      const jwt = await generateAccessToken(subjectIdentity.did, config)

      const { payload } = await verifyAccessToken(jwt, config)

      // payload verification
      expect(payload.iat).toEqual(`${modulo0Timestamp / 1000}`)
      expect(payload.nbf).toEqual(`${modulo0Timestamp / 1000}`)
      expect(payload.aud).toEqual(serviceUrl)
      expect(payload.sub).toEqual(subjectIdentity.did)
      expect(payload.iss).toEqual(issuerIdentity.did)
      expect(payload.exp).toEqual(`${modulo0Timestamp / 1000 + DEFAULT_ACCESS_TOKEN_EXPIRATION}`)
    })

    it('should throw an error if nbf > now', async () => {
      MockDate.set(modulo8Timestamp) // create the token in the future (8 seconds)
      const jwt = await generateAccessToken(subjectIdentity.did, config)

      MockDate.set(modulo0Timestamp)
      await expect(verifyAccessToken(jwt, config)).rejects.toThrow(ErrorCodes.INVALID_ACCESS_TOKEN)
    })

    it('should throw an error if exp < now', async () => {
      MockDate.set(modulo0Timestamp)
      const jwt = await generateAccessToken(subjectIdentity.did, { ...config, accessTokenExpirationTimeInSeconds: 5 })

      MockDate.set(modulo8Timestamp) // move 8 seconds to the future
      await expect(verifyAccessToken(jwt, config)).rejects.toThrow(ErrorCodes.EXPIRED_ACCESS_TOKEN)
    })
  })
})
