import express from 'express'
import setupApp from '../src'
import { challengeResponseFactory, Identity, identityFactory } from './utils'
import request from 'supertest'
import { ErrorCodes } from '../src/errors'
import { ExpressDidAuthConfig } from '../src/types'
import MockDate from 'mockdate'

describe('Express app tests', () => {
  let userDid: string
  let userIdentity: Identity

  let baseConfig: ExpressDidAuthConfig
  let challenge: string

  const challengeSecret = 'theSecret'
  const serviceUrl = 'https://service.com'

  beforeAll(async () => {
    userIdentity = await identityFactory()
    userDid = userIdentity.did
    const serviceIdentity = await identityFactory()
    const serviceSigner = serviceIdentity.signer
    const serviceDid = serviceIdentity.did

    baseConfig = { challengeSecret, serviceUrl, serviceDid, serviceSigner, includeSignup: true }
  })

  describe('no cookies', () => {
    let accessToken: string
    let refreshToken: string
    let oldRefreshToken: string
    
    const app = express()
    const agent = request.agent(app)

    beforeAll(async () => {
      await setupApp(baseConfig)(app)
    })

    it('1. GET /request-signup', async () => {
      const response = await agent.get(`/request-signup/${userDid}`).expect(200)

      challenge = response.body.challenge
      expect(challenge).toBeTruthy()
    })

    it('2. POST /signup', async () => {
      const challengeResponse = await challengeResponseFactory(challenge, userIdentity, serviceUrl)
      const response = await agent.post(`/signup`).send({ response: challengeResponse }).expect(200)

      accessToken = response.body.accessToken
      expect(accessToken).toBeTruthy()

      refreshToken = response.body.refreshToken
      expect(refreshToken).toBeTruthy()

      // no cookies
      expect(response.header['set-cookie']).toBeFalsy()
    })

    it('3. GET /request-auth', async () => {
      const response = await agent.get(`/request-auth/${userDid}`).expect(200)

      challenge = response.body.challenge
      expect(challenge).toBeTruthy()
    })

    it('4. POST /auth', async () => {
      const challengeResponse = await challengeResponseFactory(challenge, userIdentity, serviceUrl)
      const response = await agent.post(`/auth`).send({ response: challengeResponse }).expect(200)

      accessToken = response.body.accessToken
      expect(accessToken).toBeTruthy()

      refreshToken = response.body.refreshToken
      expect(refreshToken).toBeTruthy()
    })

    it('5. POST /refresh-token', async () => {
      const response = await agent.post(`/refresh-token`).send({ refreshToken }).expect(200)

      accessToken = response.body.accessToken
      expect(accessToken).toBeTruthy()

      oldRefreshToken = refreshToken
      refreshToken = response.body.refreshToken
      expect(refreshToken).toBeTruthy()
    })

    it('5b. POST /refresh-token with old one should fail', async () => {
      const response = await agent.post(`/refresh-token`).send({ refreshToken: oldRefreshToken }).expect(401)

      expect(response.text).toEqual(ErrorCodes.INVALID_OR_EXPIRED_SESSION)
    })

    it('6. POST /logout with no access token should fail', async () => {
      const response = await agent.post(`/logout`).expect(401)

      expect(response.text).toEqual(ErrorCodes.NO_ACCESS_TOKEN)
    })

    it('6b. POST /logout with proper access token', async () => {
      await agent
        .post(`/logout`)
        .set('Authorization', `DIDAuth ${accessToken}`)
        .expect(200)
    })

    it('7. POST /refresh-token with logged out session one should fail', async () => {
      const response = await agent.post(`/refresh-token`).send({ refreshToken }).expect(401)

      expect(response.text).toEqual(ErrorCodes.INVALID_OR_EXPIRED_SESSION)
    })
  })

  describe('with cookies', () => {
    const cookieApp = express()

    const cookieAgent = request.agent(cookieApp)

    let accessTokenCookie: string
    let refreshTokenCookie: string
    let oldRefreshTokenCookie: string

    beforeAll(async () => {
      await setupApp({ ...baseConfig, useCookies: true })(cookieApp)
    })

    it('1. GET /request-signup', async () => {
      const response = await cookieAgent.get(`/request-signup/${userDid}`).expect(200)

      challenge = response.body.challenge
      expect(challenge).toBeTruthy()
    })

    it('2. POST /signup', async () => {
      const challengeResponse = await challengeResponseFactory(challenge, userIdentity, serviceUrl)
      const { header, body } = await cookieAgent.post(`/signup`).send({ response: challengeResponse }).expect(200)
      
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
      const challengeResponse = await challengeResponseFactory(challenge, userIdentity, serviceUrl)
      const { header, body } = await cookieAgent.post(`/auth`).send({ response: challengeResponse }).expect(200)

      expect(body).toMatchObject({})
      expect(header['set-cookie']).toHaveLength(2);

      ([accessTokenCookie, refreshTokenCookie] = header['set-cookie'])
      expect(accessTokenCookie).toContain('authorization')
      expect(refreshTokenCookie).toContain('refresh-token')
    })

    it('5. POST /refresh-token', async () => {
      MockDate.set(Date.now() + 10000) // mock date so new access token will be different from old one

      // need to set the cookie manually because it has the secure attribute, which makes supertes to do not send it because there is no https. Still need to research on this
      const { header, body } = await cookieAgent.post(`/refresh-token`).set('Cookie', refreshTokenCookie).expect(200) 

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
      const response = await cookieAgent.post(`/refresh-token`).set('Cookie', oldRefreshTokenCookie).expect(401)

      expect(response.text).toEqual(ErrorCodes.INVALID_OR_EXPIRED_SESSION)
    })

    it('6. POST /logout with no access token should fail', async () => {
      const response = await cookieAgent.post(`/logout`).expect(401)

      expect(response.text).toEqual(ErrorCodes.NO_ACCESS_TOKEN)
    })

    it('6b. POST /logout with proper access token', async () => {
      MockDate.set(Date.now() + 20000) // move the clock after the time set in 5. POST /refresh-token'
      
      await cookieAgent
        .post(`/logout`)
        .set('Cookie', accessTokenCookie)
        .expect(200)
        
      MockDate.reset()
    })

    it('7. POST /refresh-token with logged out session one should fail', async () => {
      const response = await cookieAgent.post(`/refresh-token`).set('Cookie', refreshTokenCookie).expect(401)

      expect(response.text).toEqual(ErrorCodes.INVALID_OR_EXPIRED_SESSION)
    })
  })

})
