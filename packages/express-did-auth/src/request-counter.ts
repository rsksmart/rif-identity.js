import { ErrorCodes } from './errors'
import { RequestCounter, RequestCounterConfig } from './types'

type Timestamp = number

export interface AccessesDictionary {
  [did: string]: Timestamp[]
}

export default class implements RequestCounter {
  private accesses: AccessesDictionary
  private maxRequests: number
  private timeSlotInSeconds: number

  constructor({ maxRequestsPerTimeSlot, timeSlotInSeconds }: RequestCounterConfig) {
    this.accesses = { }
    this.maxRequests = maxRequestsPerTimeSlot || 20
    this.timeSlotInSeconds = timeSlotInSeconds || 10 * 60
  }

  count(did: string) {
    if (!did) throw new Error(ErrorCodes.INVALID_DID)

    const now = Date.now()

    if (!this.accesses[did]) this.accesses[did] = [now]
    else if (this.accesses[did].length < this.maxRequests) this.accesses[did].push(now)
    else {
      if (now - this.accesses[did][0] > (this.timeSlotInSeconds * 1000)) {
        this.accesses[did].shift()
        this.accesses[did].push(now)
      } else {
        throw new Error(ErrorCodes.MAX_REQUESTS_REACHED)
      }
    }
  }
}
