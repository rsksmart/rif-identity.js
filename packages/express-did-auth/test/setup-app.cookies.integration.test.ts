import express from 'express'
import setupApp from '../src'
import { challengeResponseFactory, identityFactory, ChallengeResponse,
  testChallengeInResponse, testAuthenticationResponseForUser,
  getCSRFTokenFromResponse, getAccessTokenHeader
} from './utils'
import request from 'supertest'
import { INVALID_OR_EXPIRED_SESSION, NO_ACCESS_TOKEN, NO_REFRESH_TOKEN, CSRF_ERROR_MESSAGE } from '../src/errors'
import { ACCESS_TOKEN_COOKIE_NAME, CSRF_TOKEN_HEADER_NAME, REFRESH_TOKEN_COOKIE_NAME, LOGGED_DID_COOKIE_NAME } from '../src/constants'
import MockDate from 'mockdate'

// eslint-disable dot-notation

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
    let csrfToken: string

    const { identity, privateKey } = identityFactory()
    const userIdentity = identity
    const userDid = userIdentity.did

    const serviceIdentity = identityFactory().identity
    const serviceSigner = serviceIdentity.signer
    const serviceDid = serviceIdentity.did

    setupApp({ challengeSecret, serviceUrl, serviceDid, serviceSigner, useCookies: true })(app)

    const testAuthenticationResponse = testAuthenticationResponseForUser(userDid)

    // Sign up

    // 1. GET /request-signup
    response = await agent.get(`/request-signup/${userDid}`).expect(200)

    challenge = testChallengeInResponse(response)
    csrfToken = getCSRFTokenFromResponse(response)

    // 2. POST /signup
    challengeResponse = challengeResponseFactory(challenge, userIdentity, privateKey, serviceUrl)

    response = await agent.post('/signup')
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .send({ response: challengeResponse })
      .expect(200)

    tokens = testAuthenticationResponse(response)

    // Auth

    // 3. GET /request-auth

    response = await agent.get(`/request-auth/${userDid}`).expect(200)

    challenge = testChallengeInResponse(response)
    csrfToken = getCSRFTokenFromResponse(response)

    // 4. POST /auth
    challengeResponse = challengeResponseFactory(challenge, userIdentity, privateKey, serviceUrl)

    response = await agent.post('/auth')
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .send({ response: challengeResponse })
      .expect(200)

    tokens = testAuthenticationResponse(response)
    csrfToken = getCSRFTokenFromResponse(response)

    // 5. POST /refresh-token'
    // save old tokens to compare then
    const oldTokens = tokens

    // increment current time to make sure that the new access token will be different
    MockDate.set(Date.now() + 5000)

    response = await agent.post('/refresh-token')
      .set('Cookie', getAccessTokenHeader(tokens))
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .set(LOGGED_DID_COOKIE_NAME, userDid)
      .expect(200)

    tokens = testAuthenticationResponse(response)
    csrfToken = getCSRFTokenFromResponse(response)

    // new tokens must be different
    expect(tokens).not.toEqual(oldTokens)
    expect(tokens[1]).not.toEqual(oldTokens[1])
    expect(tokens[2]).not.toEqual(oldTokens[2])

    // 5b. POST /refresh-token with old one should fail
    response = await agent.post('/refresh-token')
      .set('Cookie', getAccessTokenHeader(oldTokens))
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .set(LOGGED_DID_COOKIE_NAME, userDid)
      .expect(401)

    csrfToken = getCSRFTokenFromResponse(response)

    expect(response.text).toEqual(INVALID_OR_EXPIRED_SESSION)

    // 6. POST /logout with no access token should fail
    response = await agent.post('/logout')
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .set(LOGGED_DID_COOKIE_NAME, userDid)
      .expect(401)

    expect(response.text).toEqual(NO_ACCESS_TOKEN)

    // 6b. POST /logout with no csrf should fail
    response = await agent.post('/logout')
      .set('Cookie', getAccessTokenHeader(tokens))
      .set(LOGGED_DID_COOKIE_NAME, userDid)
      .expect(403)

    expect(response.text).toEqual(CSRF_ERROR_MESSAGE)

    // 6c. POST /logout with proper access token
    response = await agent.post('/logout')
      .set('Cookie', getAccessTokenHeader(tokens))
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .set(LOGGED_DID_COOKIE_NAME, userDid)
      .expect(200)

    const expiredCookies = response.headers['set-cookie']
    expect(expiredCookies[1]).toContain(`${ACCESS_TOKEN_COOKIE_NAME}-${userDid}=;`)
    expect(expiredCookies[2]).toContain(`${REFRESH_TOKEN_COOKIE_NAME}-${userDid}=;`)

    // 7. POST /refresh-token with logged out session one should fail
    response = await agent.post('/refresh-token')
      .set('Cookie', getAccessTokenHeader(tokens))
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
