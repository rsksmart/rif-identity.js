import express from 'express'
import setupApp from '../src'
import { challengeResponseFactory, Identity, identityFactory } from './utils'
import request from 'supertest'
import { ErrorCodes } from '../src/errors'

describe('Express app tests', () => {
  let userDid: string
  let userIdentity: Identity
  let accessToken: string
  let refreshToken: string
  let oldRefreshToken: string
  let challenge: string

  const challengeSecret = 'theSecret'
  const serviceUrl = 'https://service.com'

  const app = express()
  const agent = request.agent(app)

  beforeAll(async () => {
    userIdentity = await identityFactory()
    userDid = userIdentity.did
    const serviceIdentity = await identityFactory()
    const serviceSigner = serviceIdentity.signer
    const serviceDid = serviceIdentity.did

    setupApp({ challengeSecret, serviceUrl, serviceDid, serviceSigner })(app)
  })

  test('1. GET /request-signup', async () => {
    const response = await agent.get(`/request-signup/${userDid}`).expect(200)

    challenge = response.body.challenge
    expect(challenge).toBeTruthy()
  })

  test('2. POST /signup', async () => {
    const challengeResponse = await challengeResponseFactory(challenge, userIdentity, serviceUrl)
    const response = await agent.post('/signup').send({ response: challengeResponse }).expect(200)

    accessToken = response.body.accessToken
    expect(accessToken).toBeTruthy()

    refreshToken = response.body.refreshToken
    expect(refreshToken).toBeTruthy()

    // no cookies
    expect(response.header['set-cookie']).toBeFalsy()
  })

  test('3. GET /request-auth', async () => {
    const response = await agent.get(`/request-auth/${userDid}`).expect(200)

    challenge = response.body.challenge
    expect(challenge).toBeTruthy()
  })

  test('4. POST /auth', async () => {
    const challengeResponse = await challengeResponseFactory(challenge, userIdentity, serviceUrl)
    const response = await agent.post('/auth').send({ response: challengeResponse }).expect(200)

    accessToken = response.body.accessToken
    expect(accessToken).toBeTruthy()

    refreshToken = response.body.refreshToken
    expect(refreshToken).toBeTruthy()
  })

  test('5. POST /refresh-token', async () => {
    const response = await agent.post('/refresh-token').send({ refreshToken }).expect(200)

    accessToken = response.body.accessToken
    expect(accessToken).toBeTruthy()

    oldRefreshToken = refreshToken
    refreshToken = response.body.refreshToken
    expect(refreshToken).toBeTruthy()
  })

  test('5b. POST /refresh-token with old one should fail', async () => {
    const response = await agent.post('/refresh-token').send({ refreshToken: oldRefreshToken }).expect(401)

    expect(response.text).toEqual(ErrorCodes.INVALID_OR_EXPIRED_SESSION)
  })

  test('6. POST /logout with no access token should fail', async () => {
    const response = await agent.post('/logout').expect(401)

    expect(response.text).toEqual(ErrorCodes.NO_ACCESS_TOKEN)
  })

  test('6b. POST /logout with proper access token', async () => {
    await agent
      .post('/logout')
      .set('Authorization', `DIDAuth ${accessToken}`)
      .expect(200)
  })

  test('7. POST /refresh-token with logged out session one should fail', async () => {
    const response = await agent.post('/refresh-token').send({ refreshToken }).expect(401)

    expect(response.text).toEqual(ErrorCodes.INVALID_OR_EXPIRED_SESSION)
  })
})
