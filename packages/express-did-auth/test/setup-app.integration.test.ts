import express from 'express'
import setupApp from '../src'
import { challengeResponseFactory, Identity, identityFactory } from './utils'
import request from 'supertest'
import { ErrorCodes } from '../src/errors'

describe('Express app tests', () => {
  let userDid: string
  let userIdentity: Identity
  
  let challenge: string
  let accessToken: string
  let refreshToken: string
  let oldRefreshToken: string

  const challengeSecret = 'theSecret'
  const serviceUrl = 'https://service.com'

  const app = express()

  beforeAll(async () => {
    userIdentity = await identityFactory()
    userDid = userIdentity.did
    const serviceIdentity = await identityFactory()
    const serviceSigner = serviceIdentity.signer
    const serviceDid = serviceIdentity.did
    await setupApp({ challengeSecret, serviceUrl, serviceDid, serviceSigner, includeSignup: true })(app)
  })

  it('1. GET /request-signup', async () => {
    const response = await request(app).get(`/request-signup/${userDid}`).expect(200)

    challenge = response.body.challenge
    expect(challenge).toBeTruthy()
  })

  it('2. POST /signup', async () => {
    const challengeResponse = await challengeResponseFactory(challenge, userIdentity, serviceUrl)
    const response = await request(app).post(`/signup`).send({ response: challengeResponse }).expect(200)

    accessToken = response.body.accessToken
    expect(accessToken).toBeTruthy()

    refreshToken = response.body.refreshToken
    expect(refreshToken).toBeTruthy()
  })

  it('3. GET /request-auth', async () => {
    const response = await request(app).get(`/request-auth/${userDid}`).expect(200)

    challenge = response.body.challenge
    expect(challenge).toBeTruthy()
  })

  it('4. POST /auth', async () => {
    const challengeResponse = await challengeResponseFactory(challenge, userIdentity, serviceUrl)
    const response = await request(app).post(`/auth`).send({ response: challengeResponse }).expect(200)

    accessToken = response.body.accessToken
    expect(accessToken).toBeTruthy()

    refreshToken = response.body.refreshToken
    expect(refreshToken).toBeTruthy()
  })

  it('5. POST /refresh-token', async () => {
    const response = await request(app).post(`/refresh-token`).send({ refreshToken }).expect(200)

    accessToken = response.body.accessToken
    expect(accessToken).toBeTruthy()

    oldRefreshToken = refreshToken
    refreshToken = response.body.refreshToken
    expect(refreshToken).toBeTruthy()
  })

  it('5b. POST /refresh-token with old one should fail', async () => {
    const response = await request(app).post(`/refresh-token`).send({ refreshToken: oldRefreshToken }).expect(401)

    expect(response.text).toEqual(ErrorCodes.INVALID_OR_EXPIRED_SESSION)
  })

  it('6. POST /logout with no access token should fail', async () => {
    const response = await request(app).post(`/logout`).expect(401)

    expect(response.text).toEqual(ErrorCodes.NO_ACCESS_TOKEN)
  })

  it('6b. POST /logout with proper access token', async () => {
    await request(app)
      .post(`/logout`)
      .set('Authorization', `DIDAuth ${accessToken}`)
      .expect(200)
  })

  it('7. POST /refresh-token with logged out session one should fail', async () => {
    const response = await request(app).post(`/refresh-token`).send({ refreshToken }).expect(401)

    expect(response.text).toEqual(ErrorCodes.INVALID_OR_EXPIRED_SESSION)
  })
})
