import { ErrorCodes } from '../src/errors'
import RequestCounter from '../src/classes/request-counter'
import MockDate from 'mockdate'

describe('RequestCounter', () => {
  afterEach(() => MockDate.reset())

  describe('count', () => {
    const did = 'did:ethr:rsk:testnet:0xd69ced736454347be68aead53fcc1678cb9a70ef'

    it('should throw an error if no did', () => {
      const counter = new RequestCounter({})

      expect(() => counter.count(undefined)).toThrow(ErrorCodes.INVALID_DID)
    })

    it('should count for the first time with a valid did', () => {
      const counter = new RequestCounter({})

      counter.count(did)
    })

    it('should not allow to count more than the limit', () => {
      const counter = new RequestCounter({ maxRequestsPerTimeSlot: 5, timeSlotInSeconds: 100 })

      for (let i = 0; i < 5; i++) counter.count(did)

      // 6th time should throw an error
      expect(() => counter.count(did)).toThrow(ErrorCodes.MAX_REQUESTS_REACHED)
    })

    it('should allow to count more than the limit if the requests are divided in different timeslots', () => {
      const counter = new RequestCounter({ maxRequestsPerTimeSlot: 5, timeSlotInSeconds: 100 })

      for (let i = 0; i < 5; i++) counter.count(did)

      const milisecondsOffset = 150
      MockDate.set(Date.now() + 100 * 1000 + milisecondsOffset)

      // should be able to count until maxRequests again
      for (let i = 0; i < 5; i++) counter.count(did)

      MockDate.reset()
    })

    it('should not allow to count more than the limit when reaching the second timeslot', () => {
      const counter = new RequestCounter({ maxRequestsPerTimeSlot: 5, timeSlotInSeconds: 100 })

      for (let i = 0; i < 5; i++) counter.count(did)

      const milisecondsOffset = 150
      MockDate.set(Date.now() + 100 * 1000 + milisecondsOffset)

      // should be able to count maxLimit again
      for (let i = 0; i < 5; i++) counter.count(did)

      // 11th time should throw an error
      expect(() => counter.count(did)).toThrow(ErrorCodes.MAX_REQUESTS_REACHED)

      MockDate.reset()
    })
  })
})
