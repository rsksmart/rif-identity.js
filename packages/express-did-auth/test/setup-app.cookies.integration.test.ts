import express from 'express'
import setupApp from '../src'
import { challengeResponseFactory, identityFactory, ChallengeResponse } from './utils'
import request from 'supertest'
import { INVALID_OR_EXPIRED_SESSION, NO_ACCESS_TOKEN, NO_REFRESH_TOKEN } from '../src/errors'
import { ACCESS_TOKEN_COOKIE_NAME, CSRF_TOKEN_HEADER_NAME, REFRESH_TOKEN_COOKIE_NAME, LOGGED_DID_COOKIE_NAME } from '../src/constants'
import MockDate from 'mockdate'

// eslint-disable dot-notation

// for testing purposes, the cookie should be sent without attributes
const removeExtraCookieAttributes = (cookie: string) => cookie.substr(0, cookie.indexOf('; Path=/'))

describe('Express app tests - cookies', () => {
  const challengeSecret = 'theSecret'
  const serviceUrl = 'https://service.com'

  const app = express()
  const agent = request.agent(app)

  test('integration', async () => {
    let challengeResponse: ChallengeResponse
    let response: any
    let challenge: string
    let tokens: string[]

    const { identity, privateKey } = identityFactory()
    const userIdentity = identity
    const userDid = userIdentity.did

    const serviceIdentity = identityFactory().identity
    const serviceSigner = serviceIdentity.signer
    const serviceDid = serviceIdentity.did

    setupApp({ challengeSecret, serviceUrl, serviceDid, serviceSigner, useCookies: true })(app)

    // 1. GET /request-signup
    response = await agent.get(`/request-signup/${userDid}`).expect(200)

    challenge = response.body.challenge
    expect(challenge).toBeTruthy()

    // get the csrf token to be sent as a custom header of the request
    const csrfToken = response.headers[CSRF_TOKEN_HEADER_NAME]

    // 2. POST /signup
    challengeResponse = challengeResponseFactory(challenge, userIdentity, privateKey, serviceUrl)
    response = await agent.post('/signup')
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .send({ response: challengeResponse })
      .expect(200)

    tokens = response.headers['set-cookie']
    expect(tokens).toHaveLength(2)
    expect(tokens[0]).toContain(`${ACCESS_TOKEN_COOKIE_NAME}-${userDid}`)
    expect(tokens[1]).toContain(`${REFRESH_TOKEN_COOKIE_NAME}-${userDid}`)

    // no tokens in the body
    expect(response.body).toEqual({})

    // 3. GET /request-auth
    response = await agent.get(`/request-auth/${userDid}`).expect(200)

    challenge = response.body.challenge
    expect(challenge).toBeTruthy()

    // 4. POST /auth
    challengeResponse = challengeResponseFactory(challenge, userIdentity, privateKey, serviceUrl)
    response = await agent.post('/auth')
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .send({ response: challengeResponse })
      .expect(200)

    tokens = response.headers['set-cookie']
    expect(tokens).toHaveLength(2)
    expect(tokens[0]).toContain(`${ACCESS_TOKEN_COOKIE_NAME}-${userDid}`)
    expect(tokens[1]).toContain(`${REFRESH_TOKEN_COOKIE_NAME}-${userDid}`)

    // no tokens in the body
    expect(response.body).toEqual({})

    // 5. POST /refresh-token'

    // increment current time to make sure that the new access token will be different
    MockDate.set(Date.now() + 5000)

    response = await agent.post('/refresh-token')
      .set('Cookie', `${removeExtraCookieAttributes(tokens[0])}; ${removeExtraCookieAttributes(tokens[1])}`)
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .set(LOGGED_DID_COOKIE_NAME, userDid)
      .expect(200)

    // save old tokens to compare then
    const oldTokens = tokens

    tokens = response.headers['set-cookie']
    expect(tokens).toHaveLength(2)
    expect(tokens[0]).toContain(`${ACCESS_TOKEN_COOKIE_NAME}-${userDid}`)
    expect(tokens[1]).toContain(`${REFRESH_TOKEN_COOKIE_NAME}-${userDid}`)

    // no tokens in the body
    expect(response.body).toEqual({})

    // new tokens must be different
    expect(tokens).not.toEqual(oldTokens)
    expect(tokens[0]).not.toEqual(oldTokens[0])
    expect(tokens[1]).not.toEqual(oldTokens[1])

    // 5b. POST /refresh-token with old one should fail
    response = await agent.post('/refresh-token')
      .set('Cookie', `${removeExtraCookieAttributes(oldTokens[0])}; ${removeExtraCookieAttributes(oldTokens[1])}`)
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .set(LOGGED_DID_COOKIE_NAME, userDid)
      .expect(401)

    expect(response.text).toEqual(INVALID_OR_EXPIRED_SESSION)

    // 6. POST /logout with no access token should fail
    response = await agent.post('/logout')
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .set(LOGGED_DID_COOKIE_NAME, userDid)
      .expect(401)

    expect(response.text).toEqual(NO_ACCESS_TOKEN)

    // 6b. POST /logout with proper access token
    response = await agent.post('/logout')
      .set('Cookie', `${removeExtraCookieAttributes(tokens[0])}; ${removeExtraCookieAttributes(tokens[1])}`)
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .set(LOGGED_DID_COOKIE_NAME, userDid)
      .expect(200)

    const expiredCookies = response.headers['set-cookie']
    expect(expiredCookies[0]).toContain(`${ACCESS_TOKEN_COOKIE_NAME}-${userDid}=;`)
    expect(expiredCookies[1]).toContain(`${REFRESH_TOKEN_COOKIE_NAME}-${userDid}=;`)

    // 7. POST /refresh-token with logged out session one should fail
    response = await agent.post('/refresh-token')
      .set('Cookie', `${removeExtraCookieAttributes(tokens[0])}; ${removeExtraCookieAttributes(tokens[1])}`)
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .set(LOGGED_DID_COOKIE_NAME, userDid)
      .expect(401)

    expect(response.text).toEqual(INVALID_OR_EXPIRED_SESSION)

    // 8. with the csrf header, but without the cookie
    response = await agent.post('/refresh-token')
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .set(LOGGED_DID_COOKIE_NAME, userDid)
      .expect(401)

    expect(response.text).toEqual(NO_REFRESH_TOKEN)
  })
})
