import { createSlice, PayloadAction, Dispatch } from '@reduxjs/toolkit'

interface MnemonicIdentity {
  mnemonic: string
}

type IdentityProviderType = 'mnemonic' // | 'other-provider'
type IdentityProviderArgs = MnemonicIdentity // | OtherProvider

interface IdentityProviderState {
  type: IdentityProviderType
  args?: IdentityProviderArgs
}

export interface IdentityProvidersState {
  providers: {
    [name: string]: IdentityProviderState
  },
  defaultProvider?: string
}

interface IdentityProviderPayload {
  name: string,
  provider: {
    type: IdentityProviderType,
    args: IdentityProviderArgs
  }
}

interface IdentityProviderNamePayload {
  name: string
}

export const initialState: IdentityProvidersState = {
  providers: {}
}

const signatureProviderSlice = createSlice({
  name: 'signatureProvider',
  initialState,
  reducers: {
    addProvider (state: IdentityProvidersState, { payload: { name, provider } }: PayloadAction<IdentityProviderPayload>) {
      if (!hasProviders(state)) {
        state.defaultProvider = name
      }

      if (!hasProviderByName(state, name)) {
        state.providers[name] = provider
      }
    },
    changeProvider (state: IdentityProvidersState, { payload: { name, provider } }: PayloadAction<IdentityProviderPayload>) {
      if (hasProviderByName(state, name)) {
        state.providers[name] = provider
      }
    },
    removeProvider (state: IdentityProvidersState, { payload: { name } }: PayloadAction<IdentityProviderNamePayload>) {
      delete state.providers[name]

      const signerNames = getProviderNames(state)

      if (signerNames.length === 0) {
        delete state.defaultProvider
      } else {
        state.defaultProvider = signerNames[0]
      }
    },
    setDefaultProvider (state: IdentityProvidersState, { payload: { name } }: PayloadAction<IdentityProviderNamePayload>) {
      if (Object.keys(state.providers).indexOf(name) > -1) {
        state.defaultProvider = name
      }
    }
  }
})

// actions
export const { addProvider, changeProvider, removeProvider, setDefaultProvider } = signatureProviderSlice.actions

// selectors
export const getProviderNames = (state: IdentityProvidersState) => Object.keys(state.providers)
export const hasProviders = (state: IdentityProvidersState) => !!state.defaultProvider
export const hasProviderByName = (state: IdentityProvidersState, name: string) => name in state.providers
export const getDefaultProvider = (state: IdentityProvidersState) => state.providers[state.defaultProvider!]
export const getProviderByName = (state: IdentityProvidersState, name: string) => state.providers[name]

// dispatchers
type AddMnemonicProvider = (dispatch: Dispatch) => (name: string, mnemonic: string) => void
type AddMnemonicProviderDefault = (dispatch: Dispatch) => (mnemonic: string) => void

export const addMnemonicProvider: AddMnemonicProvider = (dispatch) => (name, mnemonic) => {
  dispatch(addProvider({
    name,
    provider: {
      type: 'mnemonic',
      args: {
        mnemonic
      }
    }
  }))
}

export const addMnemonicProviderDefault: AddMnemonicProviderDefault = (dispatch) => (mnemonic) => {
  addMnemonicProvider(dispatch)('default', mnemonic)
}

// reducer
export default signatureProviderSlice.reducer
