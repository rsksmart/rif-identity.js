import express from 'express'
import setupApp from '../src'
import { challengeResponseFactory, identityFactory, ChallengeResponse,
  testChallengeInResponse, testAuthenticationResponseForUser,
  getCSRFTokenFromResponse, getAccessTokenHeader
} from './utils'
import request from 'supertest'
import { INVALID_OR_EXPIRED_SESSION, NO_ACCESS_TOKEN } from '../src/errors'
import { ACCESS_TOKEN_COOKIE_NAME, CSRF_TOKEN_HEADER_NAME, LOGGED_DID_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from '../src/constants'

// eslint-disable dot-notation

describe('Express app tests - cookies with multiple sessions', () => {
  const challengeSecret = 'theSecret'
  const serviceUrl = 'https://service.com'

  const app = express()
  const agent = request.agent(app)

  test('integration', async () => {
    let challengeResponse: ChallengeResponse
    let response: any
    let challenge: string
    let csrfToken: string

    const serviceIdentity = identityFactory().identity
    const serviceSigner = serviceIdentity.signer
    const serviceDid = serviceIdentity.did

    setupApp({ challengeSecret, serviceUrl, serviceDid, serviceSigner, useCookies: true, noCsrfSecure: true })(app)

    const id1 = identityFactory()
    const userDid1 = id1.identity.did
    const id2 = identityFactory()
    const userDid2 = id2.identity.did

    const testAuthForDid1 = testAuthenticationResponseForUser(userDid1)
    const testAuthForDid2 = testAuthenticationResponseForUser(userDid2)

    // 1. GET /request-auth with userDid 1
    response = await agent.get(`/request-auth/${userDid1}`).expect(200)

    challenge = testChallengeInResponse(response)
    csrfToken = getCSRFTokenFromResponse(response)

    // 2. POST /auth with userDid 1
    challengeResponse = challengeResponseFactory(challenge, id1.identity, id1.privateKey, serviceUrl)
    response = await agent.post('/auth')
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .send({ response: challengeResponse })
      .expect(200)

    const tokensDid1 = testAuthForDid1(response)

    // 3. GET /request-auth with userDid2
    response = await agent
      .get(`/request-auth/${userDid2}`)
      .expect(200)

    challenge = testChallengeInResponse(response)
    csrfToken = getCSRFTokenFromResponse(response)

    // 4. POST /auth with userDid 2
    challengeResponse = challengeResponseFactory(challenge, id2.identity, id2.privateKey, serviceUrl)
    response = await agent.post('/auth')
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .send({ response: challengeResponse })
      .expect(200)

    const tokensDid2 = testAuthForDid2(response)
    csrfToken = getCSRFTokenFromResponse(response)

    // 5. POST /logout with userDid1 but AT from userDid2 should fail
    response = await agent.post('/logout')
      .set('Cookie', getAccessTokenHeader(tokensDid2))
      .set(LOGGED_DID_COOKIE_NAME, userDid1)
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .expect(401)

    expect(response.text).toEqual(NO_ACCESS_TOKEN)

    csrfToken = getCSRFTokenFromResponse(response)

    // 5b. POST /logout with userDid1 should work
    response = await agent.post('/logout')
      .set('Cookie', getAccessTokenHeader(tokensDid1))
      .set(LOGGED_DID_COOKIE_NAME, userDid1)
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .expect(200)

    // should set empty cookies
    const expiredCookies = response.headers['set-cookie']
    expect(expiredCookies[0]).toContain(`${ACCESS_TOKEN_COOKIE_NAME}-${userDid1}=;`)
    expect(expiredCookies[1]).toContain(`${REFRESH_TOKEN_COOKIE_NAME}-${userDid1}=;`)

    csrfToken = getCSRFTokenFromResponse(response)

    // 6. POST refresh-token with logged out userDid1 should fail
    response = await agent.post('/refresh-token')
      .set('Cookie', getAccessTokenHeader(tokensDid1))
      .set(LOGGED_DID_COOKIE_NAME, userDid1)
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .expect(401)

    expect(response.text).toEqual(INVALID_OR_EXPIRED_SESSION)

    csrfToken = getCSRFTokenFromResponse(response)

    // 6. POST refresh-token with userDid2 should work
    response = await agent.post('/refresh-token')
      .set('Cookie', getAccessTokenHeader(tokensDid2))
      .set(LOGGED_DID_COOKIE_NAME, userDid2)
      .set(CSRF_TOKEN_HEADER_NAME, csrfToken)
      .expect(200)
  })
})
