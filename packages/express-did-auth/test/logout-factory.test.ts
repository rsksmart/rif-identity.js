import logoutFactory from '../src/factories/logout-factory'
import SessionManager from '../src/classes/session-manager'
import { mockedResFactory } from './utils'

describe('logoutFactory', () => {
  const did = 'did:ethr:rsk:testnet:0xd69ced736454347be68aead53fcc1678cb9a70ef'

  it('should return a 200', () => {
    const res = mockedResFactory(200)
    const req = { user: { did } }

    const sessionManager = new SessionManager({})

    logoutFactory(sessionManager)(req, res)
  })

  it('should not allow a user to renew the token after logout', () => {
    const res = mockedResFactory(200)
    const req = { user: { did } }

    const sessionManager = new SessionManager({})
    const token = sessionManager.create(did)

    logoutFactory(sessionManager)(req, res)

    const renewed = sessionManager.renew(token)
    expect(renewed).toBeFalsy()
  })
})
