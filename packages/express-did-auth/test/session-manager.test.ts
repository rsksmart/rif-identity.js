import SessionManager from '../src/classes/session-manager'
import MockDate from 'mockdate'
import { ErrorCodes } from '../src/errors'

describe('SessionManager', () => {
  const did = 'did:ethr:rsk:testnet:0x52a98e388cc04b123968bdc55d145edb617efc72'

  afterEach(() => MockDate.reset())

  describe('create', () => {
    test('should throw an error if no did', () => {
      const manager = new SessionManager({})

      expect(() => manager.create(undefined)).toThrow(ErrorCodes.INVALID_DID)
    })

    test('should create a refresh token', () => {
      const manager = new SessionManager({})

      const token = manager.create(did)

      expect(token).toBeTruthy()
    })
  })

  describe('renew', () => {
    test('should throw an error if no refresh token', () => {
      const manager = new SessionManager({})

      expect(() => manager.renew(undefined)).toThrow(ErrorCodes.INVALID_REFRESH_TOKEN)
    })

    test('should respond with undefined if refresh token not exists', () => {
      const manager = new SessionManager({})

      const renewed = manager.renew('invalid')

      expect(renewed).toBe(undefined)
    })

    test('should allow to refresh a just created token', () => {
      const manager = new SessionManager({})

      const metadata = { username: 'the user name' }
      const token = manager.create(did, metadata)

      const renewed = manager.renew(token)

      expect(renewed.did).toEqual(did)
      expect(renewed.metadata).toEqual(metadata)
      expect(renewed.refreshToken).toBeTruthy()
      expect(renewed.refreshToken).not.toEqual(token)
    })

    test('should allow only one refresh token at a time per did', () => {
      const manager = new SessionManager({})

      const firstToken = manager.create(did)
      const secondToken = manager.create(did)

      // should not allow to renew the first token
      expect(manager.renew(firstToken)).toBe(undefined)

      expect(manager.renew(secondToken)).toBeTruthy()
    })

    test('should do not allow to refresh an expired refresh token', () => {
      const userSessionDurationInHours = 1
      const manager = new SessionManager({ userSessionDurationInHours })

      const createTokenTimestamp = 1603300440000
      MockDate.set(createTokenTimestamp)

      const token = manager.create(did)

      // mock date to two hours later
      const afterExpirationTimestamp = createTokenTimestamp + 2 * 60 * 60 * 1000
      MockDate.set(afterExpirationTimestamp)

      const renewed = manager.renew(token)

      expect(renewed).toBe(undefined)
    })

    test('should allow to create a new refresh token even if the old one has expired', () => {
      const userSessionDurationInHours = 1
      const manager = new SessionManager({ userSessionDurationInHours })

      const createTokenTimestamp = 1603300440000
      MockDate.set(createTokenTimestamp)

      const token = manager.create(did)

      // mock date to two hours later
      const afterExpirationTimestamp = createTokenTimestamp + 2 * 60 * 60 * 1000
      MockDate.set(afterExpirationTimestamp)

      const renewed = manager.renew(token)
      expect(renewed).toBe(undefined)

      const newToken = manager.create(did)
      expect(newToken).toBeTruthy()
    })
  })

  describe('delete', () => {
    test('should throw an error if no did', () => {
      const manager = new SessionManager({})

      expect(() => manager.delete(undefined)).toThrow(ErrorCodes.INVALID_DID)
    })

    test('should not allow to renew after deleting', () => {
      const manager = new SessionManager({})

      const token = manager.create(did)
      manager.delete(did)

      expect(manager.renew(token)).toBe(undefined)
    })

    test('should not fail if did not exists', () => {
      const manager = new SessionManager({})

      manager.delete(did)
    })
  })
})
