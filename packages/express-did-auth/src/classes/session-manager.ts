import { SessionManager, UserSessionConfig } from '../types'
import { randomBytes } from 'crypto'
import { ErrorCodes } from '../errors'
import { DEFAULT_USER_SESSION_DURATION } from '../constants'

export interface UserSessionInfo {
  did: string
  expirationDate: number
  metadata: any
}

export interface UserSessionDictionary {
  [refreshToken: string]: UserSessionInfo
}

export interface DidRefreshTokenMapping {
  [did: string]: string
}

export default class implements SessionManager {
  private sessionDurationInHours: number
  private userSessions: UserSessionDictionary
  private didRefreshTokenMapping: DidRefreshTokenMapping

  constructor ({ userSessionDurationInHours }: UserSessionConfig) {
    this.sessionDurationInHours = userSessionDurationInHours || DEFAULT_USER_SESSION_DURATION
    this.userSessions = {}
    this.didRefreshTokenMapping = {}
  }

  create (did: string, metadata?: any): string {
    if (!did) throw new Error(ErrorCodes.INVALID_DID)

    // invalidates prior token
    const oldRefreshToken = this.didRefreshTokenMapping[did]
    if (oldRefreshToken) delete this.userSessions[oldRefreshToken]

    const refreshToken = randomBytes(64).toString('hex')

    this.userSessions[refreshToken] = {
      did,
      expirationDate: Date.now() + this.sessionDurationInHours * 60 * 60 * 1000,
      metadata
    }
    this.didRefreshTokenMapping[did] = refreshToken

    return refreshToken
  }

  renew (refreshToken: string): { refreshToken: string, did: string, metadata: any } {
    if (!refreshToken) throw new Error(ErrorCodes.INVALID_REFRESH_TOKEN)

    const userInfo = this.userSessions[refreshToken]

    if (userInfo) {
      if (userInfo.expirationDate >= Date.now()) {
        const { did, metadata } = userInfo

        delete this.userSessions[refreshToken]

        const newToken = this.create(did, metadata)
        this.didRefreshTokenMapping[did] = newToken

        return { refreshToken: newToken, metadata, did }
      } else {
        delete this.userSessions[refreshToken]
      }
    }
  }

  delete (did: string) {
    if (!did) throw new Error(ErrorCodes.INVALID_DID)

    const token = this.didRefreshTokenMapping[did]

    if (token) {
      delete this.didRefreshTokenMapping[did]
      delete this.userSessions[token]
    }
  }
}
