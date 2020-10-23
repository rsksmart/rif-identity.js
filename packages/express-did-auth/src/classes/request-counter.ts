import { MAX_REQUESTS_PER_TIME_SLOT, REQUEST_COUNTER_TIME_SLOT } from '../defaults'
import { ErrorCodes } from '../errors'

type Timestamp = number

export interface RequestCounterConfig {
  maxRequestsPerTimeSlot?: number
  timeSlotInSeconds?: number
}

export interface RequestCounter {
  count(did): void
}

export interface AccessesDictionary {
  [did: string]: Timestamp[]
}

export default class implements RequestCounter {
  private accesses: AccessesDictionary
  private maxRequests: number
  private timeSlotInSeconds: number

  constructor ({ maxRequestsPerTimeSlot, timeSlotInSeconds }: RequestCounterConfig) {
    this.accesses = { }
    this.maxRequests = maxRequestsPerTimeSlot || MAX_REQUESTS_PER_TIME_SLOT
    this.timeSlotInSeconds = timeSlotInSeconds || REQUEST_COUNTER_TIME_SLOT
  }

  count (did: string) {
    if (!did) throw new Error(ErrorCodes.INVALID_DID)

    const now = Date.now()

    if (!this.accesses[did]) this.accesses[did] = [now]
    else if (this.accesses[did].length < this.maxRequests) this.accesses[did].push(now)
    else if (now - this.accesses[did][0] > (this.timeSlotInSeconds * 1000)) {
      this.accesses[did].shift()
      this.accesses[did].push(now)
    } else throw new Error(ErrorCodes.MAX_REQUESTS_REACHED)
  }
}
