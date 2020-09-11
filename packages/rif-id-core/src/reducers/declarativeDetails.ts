import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface DeclarativeDetails {
  [name: string]: {
    type: string
    value: string
  }
}

export interface DeclarativeDetailsState {
  [did:string]: DeclarativeDetails
}

interface SetDeclarativeDetailsPayload {
  did: string
  declarativeDetails: DeclarativeDetails
}

const initialState: DeclarativeDetailsState = {}

const declarativeDetailsSlice = createSlice({
  name: 'declarativeDetails',
  initialState,
  reducers: {
    setDeclarativeDetails (
      state: DeclarativeDetailsState,
      { payload: { did, declarativeDetails } }: PayloadAction<SetDeclarativeDetailsPayload>
    ) {
      state[did] = Object.assign({}, state[did], declarativeDetails)
    }
  }
})

// actions
export const { setDeclarativeDetails } = declarativeDetailsSlice.actions

// selectors
export const findDeclarativeDetails = (state: DeclarativeDetailsState, did: string) => state[did]
export const findDeclarativeDetailsMatchingNames = (state: DeclarativeDetailsState, did: string, names: string[]) => {
  const declarativeDetails = state[did]
  const result: DeclarativeDetails = {}
  for (const name of names) result[name] = declarativeDetails[name]
  return result
}

// utils
export const joinDeclarativeDetails = (...declarativeDetails: DeclarativeDetails[]) => Object.assign({}, ...declarativeDetails)

export default declarativeDetailsSlice.reducer
