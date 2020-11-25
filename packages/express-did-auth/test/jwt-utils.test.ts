import { EXPIRED_ACCESS_TOKEN, INVALID_ACCESS_TOKEN } from '../src/errors'
import { Identity, identityFactory, modulo0Timestamp, modulo8Timestamp } from './utils'
import { generateAccessToken, getDidResolver, verifyReceivedJwt } from '../src/jwt-utils'
import { AuthenticationConfig } from '../src/types'
import { decodeJWT, verifyJWT } from 'did-jwt'
import MockDate from 'mockdate'
import { ACCESS_TOKEN_EXPIRATION } from '../src/defaults'

describe('JWT Utils', () => {
  let issuerIdentity: Identity
  let subjectIdentity: Identity
  let config: AuthenticationConfig

  const serviceUrl = 'https://service.com'
  const resolver = getDidResolver({})

  beforeAll(async () => {
    issuerIdentity = await identityFactory().identity
    subjectIdentity = await identityFactory().identity

    config = {
      serviceSigner: issuerIdentity.signer,
      serviceDid: issuerIdentity.did,
      serviceUrl
    }
  })

  afterEach(() => MockDate.reset())

  describe('generateAccessToken', () => {
    test('should create a jwt without metadata', async () => {
      MockDate.set(modulo0Timestamp)

      const jwt = await generateAccessToken(subjectIdentity.did, config)

      const { payload } = await decodeJWT(jwt)

      // payload verification
      expect(payload.iat).toEqual(`${modulo0Timestamp / 1000}`)
      expect(payload.nbf).toEqual(`${modulo0Timestamp / 1000}`)
      expect(payload.aud).toEqual(serviceUrl)
      expect(payload.sub).toEqual(subjectIdentity.did)
      expect(payload.iss).toEqual(issuerIdentity.did)
      expect(payload.exp).toEqual(`${(modulo0Timestamp + ACCESS_TOKEN_EXPIRATION) / 1000}`)
      expect(payload.metada).toBeFalsy()
    })

    test('should sign with the expected alg', async () => {
      MockDate.set(modulo0Timestamp)

      const jwt = await generateAccessToken(subjectIdentity.did, config)

      const { signer, issuer } = await verifyJWT(jwt, { resolver, audience: serviceUrl })

      // eslint-disable-next-line dot-notation
      expect(signer['type']).toEqual('Secp256k1VerificationKey2018')
      // eslint-disable-next-line dot-notation
      expect(signer['controller']).toEqual(issuerIdentity.did)

      expect(issuer).toEqual(issuerIdentity.did)
    })

    test('should create a jwt with metadata', async () => {
      MockDate.set(modulo0Timestamp)

      const metadata = { username: 'alice' }
      const jwt = await generateAccessToken(subjectIdentity.did, config, metadata)

      const { payload } = await decodeJWT(jwt)

      expect(payload.username).toEqual(metadata.username)
    })
  })

  describe('verifyReceivedJwt', () => {
    test('should verify a valid jwt', async () => {
      MockDate.set(modulo0Timestamp)

      const jwt = await generateAccessToken(subjectIdentity.did, config)

      const { payload } = await verifyReceivedJwt(jwt, config)

      // payload verification
      expect(payload.iat).toEqual(`${modulo0Timestamp / 1000}`)
      expect(payload.nbf).toEqual(`${modulo0Timestamp / 1000}`)
      expect(payload.aud).toEqual(serviceUrl)
      expect(payload.sub).toEqual(subjectIdentity.did)
      expect(payload.iss).toEqual(issuerIdentity.did)
      expect(payload.exp).toEqual(`${(modulo0Timestamp + ACCESS_TOKEN_EXPIRATION) / 1000}`)
    })

    test('should throw an error if nbf > now', async () => {
      MockDate.set(modulo8Timestamp) // create the token in the future (8 seconds)
      const jwt = await generateAccessToken(subjectIdentity.did, config)

      MockDate.set(modulo0Timestamp)
      await expect(verifyReceivedJwt(jwt, config)).rejects.toThrow(INVALID_ACCESS_TOKEN)
    })

    test('should throw an error if exp < now', async () => {
      MockDate.set(modulo0Timestamp)
      const jwt = await generateAccessToken(subjectIdentity.did, { ...config, accessTokenExpirationTime: 5000 })

      MockDate.set(modulo8Timestamp) // move 8 seconds to the future
      await expect(verifyReceivedJwt(jwt, config)).rejects.toThrow(EXPIRED_ACCESS_TOKEN)
    })
  })
})
