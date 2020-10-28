import SessionManager from '../src/classes/session-manager'
import MockDate from 'mockdate'
import { INVALID_OR_EXPIRED_SESSION, INVALID_REFRESH_TOKEN } from '../src/errors'

describe('SessionManager', () => {
  afterEach(() => MockDate.reset())

  describe('createRefreshToken', () => {
    test('should create a refresh token', () => {
      const manager = new SessionManager({})

      const token = manager.createRefreshToken()

      expect(token).toBeTruthy()
    })
  })

  describe('renewRefreshToken', () => {
    test('should throw an error if no refresh token', () => {
      const manager = new SessionManager({})

      expect(() => manager.renewRefreshToken(undefined)).toThrow(INVALID_REFRESH_TOKEN)
    })

    test('should respond with undefined if refresh token not exists', () => {
      const manager = new SessionManager({})

      expect(() => manager.renewRefreshToken('invalid')).toThrow(INVALID_REFRESH_TOKEN)
    })

    test('should allow to refresh a just created token', () => {
      const metadata = { username: 'the user name' }

      const manager = new SessionManager({}, metadata)

      const token = manager.createRefreshToken()

      const renewed = manager.renewRefreshToken(token)

      expect(renewed.metadata).toEqual(metadata)
      expect(renewed.refreshToken).toBeTruthy()
      expect(renewed.refreshToken).not.toEqual(token)
    })

    test('should do not allow to refresh an expired refresh token', () => {
      const userSessionDuration = 1 * 60 * 60 * 1000
      const manager = new SessionManager({ userSessionDuration })

      const createTokenTimestamp = 1603300440000
      MockDate.set(createTokenTimestamp)

      const token = manager.createRefreshToken()

      // mock date to two hours later
      const afterExpirationTimestamp = createTokenTimestamp + 2 * 60 * 60 * 1000
      MockDate.set(afterExpirationTimestamp)

      expect(() => manager.renewRefreshToken(token)).toThrow(INVALID_OR_EXPIRED_SESSION)
    })

    test('should allow to create a new refresh token even if the old one has expired', () => {
      const userSessionDuration = 1 * 60 * 60 * 1000
      const manager = new SessionManager({ userSessionDuration })

      const createTokenTimestamp = 1603300440000
      MockDate.set(createTokenTimestamp)

      const token = manager.createRefreshToken()

      // mock date to two hours later
      const afterExpirationTimestamp = createTokenTimestamp + 2 * 60 * 60 * 1000
      MockDate.set(afterExpirationTimestamp)

      expect(() => manager.renewRefreshToken(token)).toThrow(INVALID_OR_EXPIRED_SESSION)

      const newToken = manager.createRefreshToken()
      expect(newToken).toBeTruthy()
    })
  })

  describe('getCurrentRefreshToken', () => {
    test('should return undefined if no refresh token', () => {
      const manager = new SessionManager({})

      expect(manager.getCurrentRefreshToken()).toEqual(undefined)
    })

    test('should return current refresh token', () => {
      const manager = new SessionManager({})

      const token = manager.createRefreshToken()

      expect(manager.getCurrentRefreshToken()).toEqual(token)
    })
  })
})
