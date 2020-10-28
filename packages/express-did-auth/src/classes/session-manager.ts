import { randomBytes } from 'crypto'
import { INVALID_OR_EXPIRED_SESSION, INVALID_REFRESH_TOKEN } from '../errors'
import { USER_SESSION_DURATION } from '../defaults'

type Timestamp = number

export type SessionManagerFactory = (metadata?: any) => SessionManager

export interface UserSessionConfig {
  userSessionDuration?: number
}

export interface SessionManager {
  createRefreshToken(): string
  renewRefreshToken(oldToken: string): { refreshToken: string, metadata: any }
  getCurrentRefreshToken(): string
}

export default class implements SessionManager {
  private sessionDuration: number
  public refreshToken: string
  private expirationDate: Timestamp

  constructor ({ userSessionDuration }: UserSessionConfig, private metadata?: any) {
    this.sessionDuration = userSessionDuration || USER_SESSION_DURATION
  }

  createRefreshToken (): string {
    // invalidates prior token if exists
    if (this.refreshToken) this.refreshToken = undefined

    this.refreshToken = randomBytes(64).toString('hex')
    this.expirationDate = Date.now() + this.sessionDuration

    return this.refreshToken
  }

  renewRefreshToken (oldToken: string): { refreshToken: string, metadata: any } {
    if (!this.refreshToken || !oldToken || oldToken !== this.refreshToken) throw new Error(INVALID_REFRESH_TOKEN)

    if (this.expirationDate < Date.now()) throw new Error(INVALID_OR_EXPIRED_SESSION)

    this.createRefreshToken()

    return {
      refreshToken: this.refreshToken,
      metadata: this.metadata
    }
  }

  getCurrentRefreshToken (): string {
    return this.refreshToken
  }
}
