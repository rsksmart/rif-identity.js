import { configureStore, Store, AnyAction } from '@reduxjs/toolkit'
import declarativeDetailsReducer, {
  setDeclarativeDetails,
  findDeclarativeDetails,
  findDeclarativeDetailsMatchingNames,
  joinDeclarativeDetails,
  DeclarativeDetails,
  DeclarativeDetailsState
} from '../../src/reducers/declarativeDetails'
import { did, did2 } from '../util'

const declarativeDetails: DeclarativeDetails = {
  fullName: { type: 'string', value: 'Donald Knuth' },
  dateOfBirth: { type: 'timestamp', value: '-1009065600' },
  city: { type: 'string', value: 'Wisconsin' }
}

const declarativeDetails2: DeclarativeDetails = {
  fullName: { type: 'string', value: 'Edsger Dijkstra' },
  dateOfBirth: { type: 'timestamp', value: '-1248379200' },
  city: { type: 'string', value: 'Rotterdam' }
}

describe('declarative details slice', () => {
  describe('action creators', () => {
    test('set declarativeDetails', () => {
      expect(
        setDeclarativeDetails({ did, declarativeDetails })
      ).toEqual({
        payload: { did, declarativeDetails },
        type: setDeclarativeDetails.type
      })
    })
  })

  describe('selectors', () => {
    test('find declarative details', () => {
      const state: DeclarativeDetailsState = {}
      state[did] = declarativeDetails

      expect(findDeclarativeDetails(state, did)).toEqual(declarativeDetails)
    })

    test('find declarative details in more than one identity', () => {
      const state: DeclarativeDetailsState = {}
      state[did] = declarativeDetails
      state[did2] = declarativeDetails2

      expect(findDeclarativeDetails(state, did)).toEqual(declarativeDetails)
      expect(findDeclarativeDetails(state, did2)).toEqual(declarativeDetails2)
    })

    test('find declarative details matching names', () => {
      const state: DeclarativeDetailsState = {}
      state[did] = declarativeDetails

      expect(
        findDeclarativeDetailsMatchingNames(state, did, ['fullName', 'dateOfBirth'])
      ).toEqual({
        fullName: { type: 'string', value: 'Donald Knuth' },
        dateOfBirth: { type: 'timestamp', value: '-1009065600' }
      })
    })

    test('find declarative details matching inexistent names', () => {
      const state: DeclarativeDetailsState = {}
      state[did] = declarativeDetails

      expect(
        findDeclarativeDetailsMatchingNames(state, did, ['children'])
      ).toEqual({
        children: undefined
      })
    })
  })

  describe('reducer', () => {
    let store: Store<DeclarativeDetailsState, AnyAction>

    beforeEach(() => {
      store = configureStore({ reducer: declarativeDetailsReducer })
    })

    test('initially has no declarative details', () => {
      expect(store.getState()).toEqual({})
    })

    test('can add a declarative detail', () => {
      const declarativeDetails = {
        fullName: { type: 'string', value: 'Donald Knuth' }
      }

      store.dispatch(setDeclarativeDetails({ did, declarativeDetails }))

      const expected: DeclarativeDetailsState = {}
      expected[did] = declarativeDetails

      expect(store.getState()).toEqual(expected)
    })

    test('can edit a declarative detail', () => {
      store.dispatch(setDeclarativeDetails({
        did,
        declarativeDetails: {
          fullName: { type: 'string', value: 'Donald Knuth' }
        }
      }))

      const declarativeDetails = {
        fullName: { type: 'string', value: 'Edsger Dijkstra' }
      }

      store.dispatch(setDeclarativeDetails({ did, declarativeDetails }))

      const expected: DeclarativeDetailsState = {}
      expected[did] = declarativeDetails

      expect(store.getState()).toEqual(expected)
    })

    test('can set many declarative details', () => {
      const declarativeDetails = {
        fullName: { type: 'string', value: 'Donald Knuth' },
        dateOfBirth: { type: 'timestamp', value: '-1009065600' }
      }

      store.dispatch(setDeclarativeDetails({ did, declarativeDetails }))

      const expected: DeclarativeDetailsState = {}
      expected[did] = declarativeDetails

      expect(store.getState()).toEqual(expected)
    })

    test('can delete a declarative detail', () => {
      const declarativeDetail1 = {
        fullName: { type: 'string', value: 'Donald Knuth' }
      }

      const declarativeDetail2 = {
        dateOfBirth: { type: 'timestamp', value: '-1009065600' }
      }

      store.dispatch(setDeclarativeDetails({ did, declarativeDetails: Object.assign({}, declarativeDetail1, declarativeDetail2) }))
      store.dispatch(setDeclarativeDetails({ did, declarativeDetails: { dateOfBirth: undefined } }))

      const expected: DeclarativeDetailsState = {}
      expected[did] = declarativeDetail1

      expect(store.getState()).toEqual(expected)
    })

    test('can delete many declarative details', () => {})
  })
})

describe('utils', () => {
  test('join declarative details', () => {
    const dl1: DeclarativeDetails = { fullName: { type: 'string', value: 'Donald Knuth' } }
    const dl2: DeclarativeDetails = { dateOfBirth: { type: 'timestamp', value: '-1009065600' } }
    const dl3: DeclarativeDetails = { city: { type: 'string', value: 'Wisconsin' } }

    const result = joinDeclarativeDetails(dl1, dl2, dl3)

    expect(result).toEqual(declarativeDetails)
  })
})
