import { randomBytes } from 'crypto'
import { INVALID_DID, INVALID_REFRESH_TOKEN } from '../errors'
import { USER_SESSION_DURATION } from '../defaults'

export interface UserSessionConfig {
  userSessionDurationInHours?: number
}

export interface SessionManager {
  create(did: string): string
  renew(oldToken: string): { refreshToken: string, did: string, metadata: any }
  delete(did: string): void
}

export interface UserSessionInfo {
  did: string
  expirationDate: number
  metadata: any
}

export interface RefreshTokenSessionMapping {
  [refreshToken: string]: UserSessionInfo
}

export interface DidRefreshTokenMapping {
  [did: string]: string
}

export default class implements SessionManager {
  private sessionDurationInHours: number
  private refreshTokenSessionMapping: RefreshTokenSessionMapping
  private didRefreshTokenMapping: DidRefreshTokenMapping

  constructor ({ userSessionDurationInHours }: UserSessionConfig) {
    this.sessionDurationInHours = userSessionDurationInHours || USER_SESSION_DURATION
    this.refreshTokenSessionMapping = {}
    this.didRefreshTokenMapping = {}
  }

  create (did: string, metadata?: any): string {
    if (!did) throw new Error(INVALID_DID)

    // invalidates prior token
    const oldRefreshToken = this.didRefreshTokenMapping[did]
    if (oldRefreshToken) delete this.refreshTokenSessionMapping[oldRefreshToken]

    const refreshToken = randomBytes(64).toString('hex')

    this.refreshTokenSessionMapping[refreshToken] = {
      did,
      expirationDate: Date.now() + this.sessionDurationInHours * 60 * 60 * 1000,
      metadata
    }
    this.didRefreshTokenMapping[did] = refreshToken

    return refreshToken
  }

  renew (refreshToken: string): { refreshToken: string, did: string, metadata: any } {
    if (!refreshToken) throw new Error(INVALID_REFRESH_TOKEN)

    const userInfo = this.refreshTokenSessionMapping[refreshToken]

    if (userInfo) {
      if (userInfo.expirationDate >= Date.now()) {
        const { did, metadata } = userInfo

        delete this.refreshTokenSessionMapping[refreshToken]

        const newToken = this.create(did, metadata)
        this.didRefreshTokenMapping[did] = newToken

        return { refreshToken: newToken, metadata, did }
      } else delete this.refreshTokenSessionMapping[refreshToken]
    }
  }

  delete (did: string) {
    if (!did) throw new Error(INVALID_DID)

    const token = this.didRefreshTokenMapping[did]

    if (token) {
      delete this.didRefreshTokenMapping[did]
      delete this.refreshTokenSessionMapping[token]
    }
  }
}
