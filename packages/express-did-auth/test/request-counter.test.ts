import { MAX_REQUESTS_REACHED } from '../src/errors'
import RequestCounter from '../src/classes/request-counter'
import MockDate from 'mockdate'

describe('RequestCounter', () => {
  afterEach(() => MockDate.reset())

  describe('count', () => {
    test('should not allow to count more than the limit', () => {
      const counter = new RequestCounter({ maxRequestsPerTimeSlot: 5, timeSlotInSeconds: 100 })

      for (let i = 0; i < 5; i++) counter.count()

      // 6th time should throw an error
      expect(() => counter.count()).toThrow(MAX_REQUESTS_REACHED)
    })

    test('should allow to count more than the limit if the requests are divided in different timeslots', () => {
      const counter = new RequestCounter({ maxRequestsPerTimeSlot: 5, timeSlotInSeconds: 100 })

      for (let i = 0; i < 5; i++) counter.count()

      const milisecondsOffset = 150
      MockDate.set(Date.now() + 100 * 1000 + milisecondsOffset)

      // should be able to count until maxRequests again
      for (let i = 0; i < 5; i++) counter.count()

      MockDate.reset()
    })

    test('should not allow to count more than the limit when reaching the second timeslot', () => {
      const counter = new RequestCounter({ maxRequestsPerTimeSlot: 5, timeSlotInSeconds: 100 })

      for (let i = 0; i < 5; i++) counter.count()

      const milisecondsOffset = 150
      MockDate.set(Date.now() + 100 * 1000 + milisecondsOffset)

      // should be able to count maxLimit again
      for (let i = 0; i < 5; i++) counter.count()

      // 11th time should throw an error
      expect(() => counter.count()).toThrow(MAX_REQUESTS_REACHED)

      MockDate.reset()
    })
  })
})
