import { MAX_REQUESTS_PER_TIME_SLOT, REQUEST_COUNTER_TIME_SLOT } from '../defaults'
import { MAX_REQUESTS_REACHED } from '../errors'

type Timestamp = number

export type RequestCounterFactory = () => RequestCounter

export interface RequestCounterConfig {
  maxRequestsPerTimeSlot?: number
  timeSlot?: number
}

export class RequestCounter {
  private accesses: Timestamp[]
  private maxRequests: number
  private timeSlot: number

  constructor ({ maxRequestsPerTimeSlot, timeSlot }: RequestCounterConfig) {
    this.accesses = []
    this.maxRequests = maxRequestsPerTimeSlot || MAX_REQUESTS_PER_TIME_SLOT
    this.timeSlot = timeSlot || REQUEST_COUNTER_TIME_SLOT
  }

  count () {
    const now = Date.now()

    if (!this.accesses) this.accesses = [now]
    else if (this.accesses.length < this.maxRequests) this.accesses.push(now)
    else if (now - this.accesses[0] > this.timeSlot) {
      this.accesses.shift()
      this.accesses.push(now)
    } else throw new Error(MAX_REQUESTS_REACHED)
  }
}
