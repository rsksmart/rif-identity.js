import express from 'express'
import setupApp from '../src'
import { challengeResponseFactory, identityFactory, ChallengeResponse } from './utils'
import request from 'supertest'
import { INVALID_OR_EXPIRED_SESSION, NO_ACCESS_TOKEN } from '../src/errors'
import { ACCESS_TOKEN_COOKIE_NAME, CSRF_TOKEN_HEADER_NAME, LOGGED_DID_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from '../src/constants'

// eslint-disable dot-notation

const removeExtraCookieAttributes = (cookie: string) => cookie.substr(0, cookie.indexOf('; Path=/'))

describe('Express app tests - cookies with multiple sessions', () => {
  const challengeSecret = 'theSecret'
  const serviceUrl = 'https://service.com'

  const app = express()
  const agent = request.agent(app)

  test('integration', async () => {
    let challengeResponse: ChallengeResponse
    let response: any
    let challenge: string

    const serviceIdentity = identityFactory().identity
    const serviceSigner = serviceIdentity.signer
    const serviceDid = serviceIdentity.did

    setupApp({ challengeSecret, serviceUrl, serviceDid, serviceSigner, useCookies: true, allowMultipleSessions: true })(app)

    const id1 = identityFactory()
    const userDid1 = id1.identity.did
    const id2 = identityFactory()
    const userDid2 = id2.identity.did

    // 1. GET /request-auth with userDid 1
    response = await agent.get(`/request-auth/${userDid1}`).expect(200)

    challenge = response.body.challenge
    expect(challenge).toBeTruthy()

    // get the csrf token to be sent as a custom header of the request
    const csrfToken = response.headers[CSRF_TOKEN_HEADER_NAME]

    // 2. POST /auth with userDid 2
    challengeResponse = challengeResponseFactory(challenge, id1.identity, id1.privateKey, serviceUrl)
    response = await agent.post('/auth')
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .send({ response: challengeResponse })
      .expect(200)

    const tokensDid1 = response.headers['set-cookie']
    expect(tokensDid1).toHaveLength(2)
    expect(tokensDid1[0]).toContain(`${ACCESS_TOKEN_COOKIE_NAME}-${userDid1}`)
    expect(tokensDid1[1]).toContain(`${REFRESH_TOKEN_COOKIE_NAME}-${userDid1}`)

    // no tokens in the body
    expect(response.body).toEqual({})

    // 3. GET /request-auth with userDid2
    response = await agent
      .get(`/request-auth/${userDid2}`)
      .expect(200)

    challenge = response.body.challenge
    expect(challenge).toBeTruthy()

    // 4. POST /auth with userDid 2
    challengeResponse = challengeResponseFactory(challenge, id2.identity, id2.privateKey, serviceUrl)
    response = await agent.post('/auth')
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .send({ response: challengeResponse })
      .expect(200)

    const tokensDid2 = response.headers['set-cookie']
    expect(tokensDid2).toHaveLength(2)
    expect(tokensDid2[0]).toContain(`${ACCESS_TOKEN_COOKIE_NAME}-${userDid2}`)
    expect(tokensDid2[1]).toContain(`${REFRESH_TOKEN_COOKIE_NAME}-${userDid2}`)

    // no tokens in the body
    expect(response.body).toEqual({})

    // 5. POST /logout with userDid1 but AT from userDid2 should fail
    response = await agent.post('/logout')
      .set('Cookie', `${removeExtraCookieAttributes(tokensDid2[0])}; ${removeExtraCookieAttributes(tokensDid2[1])}`)
      .set(LOGGED_DID_COOKIE_NAME, userDid1)
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .expect(401)

    expect(response.text).toEqual(NO_ACCESS_TOKEN)

    // 5b. POST /logout with userDid1 should work
    response = await agent.post('/logout')
      .set('Cookie', `${removeExtraCookieAttributes(tokensDid1[0])}; ${removeExtraCookieAttributes(tokensDid1[1])}`)
      .set(LOGGED_DID_COOKIE_NAME, userDid1)
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .expect(200)

    // should set empty cookies
    const expiredCookies = response.headers['set-cookie']
    expect(expiredCookies[0]).toContain(`${ACCESS_TOKEN_COOKIE_NAME}-${userDid1}=;`)
    expect(expiredCookies[1]).toContain(`${REFRESH_TOKEN_COOKIE_NAME}-${userDid1}=;`)

    // 6. POST refresh-token with logged out userDid1 should fail
    response = await agent.post('/refresh-token')
      .set('Cookie', `${removeExtraCookieAttributes(tokensDid1[0])}; ${removeExtraCookieAttributes(tokensDid1[1])}`)
      .set(LOGGED_DID_COOKIE_NAME, userDid1)
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .expect(401)

    expect(response.text).toEqual(INVALID_OR_EXPIRED_SESSION)

    // 6. POST refresh-token with userDid2 should work
    response = await agent.post('/refresh-token')
      .set('Cookie', `${removeExtraCookieAttributes(tokensDid2[0])}; ${removeExtraCookieAttributes(tokensDid2[1])}`)
      .set(LOGGED_DID_COOKIE_NAME, userDid2)
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .expect(200)
  })
})
