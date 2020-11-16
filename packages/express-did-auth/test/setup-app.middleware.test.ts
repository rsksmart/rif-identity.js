import express from 'express'
import setupApp from '../src'
import { challengeResponseFactory, identityFactory } from './utils'
import request from 'supertest'

describe.skip('Express app tests', () => {
  let accessToken: string
  let authMiddleware: (req, res, next) => void

  const challengeSecret = 'theSecret'
  const serviceUrl = 'https://service.com'

  const app = express()

  beforeAll(async () => {
    const userIdentity = await identityFactory()
    const userDid = userIdentity.did
    const serviceIdentity = await identityFactory()
    const serviceSigner = serviceIdentity.signer
    const serviceDid = serviceIdentity.did

    authMiddleware = setupApp({ challengeSecret, serviceUrl, serviceDid, serviceSigner })(app)

    // perform auth
    const requestAuthResponse = await request(app).get(`/request-auth/${userDid}`).expect(200)
    const challenge = requestAuthResponse.body.challenge

    const challengeResponse = await challengeResponseFactory(challenge, userIdentity, serviceDid, serviceUrl)
    const authResponse = await request(app).post('/auth').send({ response: challengeResponse }).expect(200)

    accessToken = authResponse.body.accessToken
  })

  test('should be able to create a non protected endpoint after setup', async () => {
    app.get('/non-protected', function (req, res) { res.status(200).send('Not protected') })

    await request(app).get('/non-protected').expect(200)
  })

  test('should be able to create a protected endpoint after setup', async () => {
    app.get('/protected', authMiddleware, function (req, res) { res.status(200).send('Protected') })

    // without access token
    await request(app).get('/protected').expect(401)

    // with access token
    await request(app).get('/protected').set('Authorization', `DIDAuth ${accessToken}`).expect(200)
  })
})
