import express from 'express'
import setupApp from '../src'
import { challengeResponseFactory, Identity, identityFactory } from './utils'
import request from 'supertest'
import { INVALID_OR_EXPIRED_SESSION, NO_ACCESS_TOKEN } from '../src/errors'
import MockDate from 'mockdate'

// skipped because there are some issue to fix related to csurf middleware
describe.skip('Express app tests (using cookies)', () => {
  let userDid: string
  let userIdentity: Identity
  let userPrivateKey: string
  let accessTokenCookie: string
  let refreshTokenCookie: string
  let oldRefreshTokenCookie: string
  let challenge: string
  let serviceDid: string

  const cookieApp = express()
  const cookieAgent = request.agent(cookieApp)
  const challengeSecret = 'theSecret'
  const serviceUrl = 'https://service.com'

  beforeAll(async () => {
    const { identity, privateKey } = identityFactory()
    userIdentity = identity
    userPrivateKey = privateKey
    userDid = userIdentity.did

    const serviceIdentity = identityFactory().identity
    const serviceSigner = serviceIdentity.signer
    serviceDid = serviceIdentity.did

    setupApp({ challengeSecret, serviceUrl, serviceDid, serviceSigner, useCookies: true })(cookieApp)
  })

  it('1. GET /request-signup', async () => {
    const response = await cookieAgent.get(`/request-signup/${userDid}`).expect(200)

    challenge = response.body.challenge
    expect(challenge).toBeTruthy()
  })

  it('2. POST /signup', async () => {
    const challengeResponse = await challengeResponseFactory(challenge, userIdentity, userPrivateKey, serviceUrl)
    const { header, body } = await cookieAgent.post('/signup').send({ response: challengeResponse }).expect(200)

    expect(body).toMatchObject({})
    expect(header['set-cookie']).toHaveLength(2)
    expect(header['set-cookie'][0]).toContain('authorization')
    expect(header['set-cookie'][1]).toContain('refresh-token')
  })

  it('3. GET /request-auth', async () => {
    const response = await cookieAgent.get(`/request-auth/${userDid}`).expect(200)

    challenge = response.body.challenge
    expect(challenge).toBeTruthy()
  })

  it('4. POST /auth', async () => {
    const challengeResponse = await challengeResponseFactory(challenge, userIdentity, userPrivateKey, serviceUrl)
    const { header, body } = await cookieAgent.post('/auth').send({ response: challengeResponse }).expect(200)

    expect(body).toMatchObject({})
    expect(header['set-cookie']).toHaveLength(2);

    ([accessTokenCookie, refreshTokenCookie] = header['set-cookie'])
    expect(accessTokenCookie).toContain('authorization')
    expect(refreshTokenCookie).toContain('refresh-token')
  })

  it('5. POST /refresh-token', async () => {
    MockDate.set(Date.now() + 10000) // mock date so new access token will be different from old one

    // need to set the cookie manually because it has the secure attribute, which makes supertes to do not send it because there is no https. Still need to research on this
    const { header, body } = await cookieAgent.post('/refresh-token').set('Cookie', refreshTokenCookie).expect(200)

    const cookies = header['set-cookie']
    expect(body).toMatchObject({})
    expect(cookies).toHaveLength(2)
    expect(cookies).not.toEqual(accessTokenCookie)
    expect(cookies).not.toEqual(refreshTokenCookie)

    oldRefreshTokenCookie = refreshTokenCookie;
    [accessTokenCookie, refreshTokenCookie] = cookies

    MockDate.reset()
  })

  it('5b. POST /refresh-token with old one should fail', async () => {
    const response = await cookieAgent.post('/refresh-token').set('Cookie', oldRefreshTokenCookie).expect(401)

    expect(response.text).toEqual(INVALID_OR_EXPIRED_SESSION)
  })

  it('6. POST /logout with no access token should fail', async () => {
    const response = await cookieAgent.post('/logout').expect(401)

    expect(response.text).toEqual(NO_ACCESS_TOKEN)
  })

  it('6b. POST /logout with proper access token', async () => {
    MockDate.set(Date.now() + 20000) // move the clock after the time set in 5. POST /refresh-token'

    await cookieAgent
      .post('/logout')
      .set('Cookie', accessTokenCookie)
      .expect(200)

    MockDate.reset()
  })

  it('7. POST /refresh-token with logged out session one should fail', async () => {
    const response = await cookieAgent.post('/refresh-token').set('Cookie', refreshTokenCookie).expect(401)

    expect(response.text).toEqual(INVALID_OR_EXPIRED_SESSION)
  })
})
