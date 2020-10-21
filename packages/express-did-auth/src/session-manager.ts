import { SessionManager, UserSessionConfig } from './types'
import { randomBytes } from 'crypto'

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
    this.sessionDurationInHours = userSessionDurationInHours || 7 * 24
    this.userSessions = {}
    this.didRefreshTokenMapping = {}
  }

  createRefreshToken(did: string, metadata?: any): string {
    const refreshToken = randomBytes(64).toString('hex')

    this.userSessions[refreshToken] = {
      did,
      expirationDate: Date.now() + this.sessionDurationInHours * 60 * 60 * 1000,
      metadata
    }
    this.didRefreshTokenMapping[did] = refreshToken

    return refreshToken
  }

  renewRefreshToken(refreshToken: string): { refreshToken: string, did: string, metadata: any } {
    const userInfo = this.userSessions[refreshToken]

    if (userInfo?.expirationDate >= Date.now()) {
      const { did, metadata } = userInfo
      delete this.userSessions[refreshToken]
      const newToken = this.createRefreshToken(did, metadata)
      this.didRefreshTokenMapping[did] = newToken

      return { refreshToken: newToken, metadata, did }
    }

    return null
  }

  logout(did: string) {
    const token = this.didRefreshTokenMapping[did]

    delete this.didRefreshTokenMapping[did]
    delete this.userSessions[token]
  }
}
