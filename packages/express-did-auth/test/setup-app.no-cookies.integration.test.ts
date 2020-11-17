import express from 'express'
import setupApp from '../src'
import { challengeResponseFactory, identityFactory, ChallengeResponse } from './utils'
import request from 'supertest'
import { INVALID_OR_EXPIRED_SESSION, NO_ACCESS_TOKEN } from '../src/errors'

describe('Express app tests - no cookies', () => {

  const challengeSecret = 'theSecret'
  const serviceUrl = 'https://service.com'

  const app = express()
  const agent = request.agent(app)

  test('integration', async () => {
    let accessToken: string
    let refreshToken: string
    let challengeResponse: ChallengeResponse
    let response: any
    let oldRefreshToken: string
    let challenge: string

    const { identity, privateKey } = identityFactory()
    const userIdentity = identity
    const userDid = userIdentity.did

    const serviceIdentity = identityFactory().identity
    const serviceSigner = serviceIdentity.signer
    const serviceDid = serviceIdentity.did

    setupApp({ challengeSecret, serviceUrl, serviceDid, serviceSigner })(app)

    // 1. GET /request-signup
    response = await agent.get(`/request-signup/${userDid}`).expect(200)

    challenge = response.body.challenge
    expect(challenge).toBeTruthy()

    // 2. POST /signup
    challengeResponse = challengeResponseFactory(challenge, userIdentity, privateKey, serviceUrl)
    response = await agent.post('/signup').send({ response: challengeResponse }).expect(200)

    accessToken = response.body.accessToken
    expect(accessToken).toBeTruthy()

    refreshToken = response.body.refreshToken
    expect(refreshToken).toBeTruthy()

    // no cookies
    expect(response.header['set-cookie']).toBeFalsy()

    // 3. GET /request-auth
    response = await agent.get(`/request-auth/${userDid}`).expect(200)

    challenge = response.body.challenge
    expect(challenge).toBeTruthy()

    // 4. POST /auth
    challengeResponse = challengeResponseFactory(challenge, userIdentity, privateKey, serviceUrl)
    response = await agent.post('/auth').send({ response: challengeResponse }).expect(200)

    accessToken = response.body.accessToken
    expect(accessToken).toBeTruthy()

    refreshToken = response.body.refreshToken
    expect(refreshToken).toBeTruthy()

    // 5. POST /refresh-token'
    response = await agent.post('/refresh-token').send({ refreshToken }).expect(200)

    accessToken = response.body.accessToken
    expect(accessToken).toBeTruthy()

    oldRefreshToken = refreshToken
    refreshToken = response.body.refreshToken
    expect(refreshToken).toBeTruthy()

    // 5b. POST /refresh-token with old one should fail
    response = await agent.post('/refresh-token').send({ refreshToken: oldRefreshToken }).expect(401)

    expect(response.text).toEqual(INVALID_OR_EXPIRED_SESSION)

    // 6. POST /logout with no access token should fail
    response = await agent.post('/logout').expect(401)

    expect(response.text).toEqual(NO_ACCESS_TOKEN)

    // 6b. POST /logout with proper access token
    await agent
      .post('/logout')
      .set('Authorization', `DIDAuth ${accessToken}`)
      .expect(200)

    // 7. POST /refresh-token with logged out session one should fail
    response = await agent.post('/refresh-token').send({ refreshToken }).expect(401)

    expect(response.text).toEqual(INVALID_OR_EXPIRED_SESSION)
  })
})
