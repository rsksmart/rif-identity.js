import { Agent } from 'daf-core'
import { Dispatch } from '@reduxjs/toolkit'
import { setIdentity } from '@rsksmart/rif-id-core-reducer/lib/identityReducer'
import { RIFIdentityProvider } from '@rsksmart/rif-id-daf'

export const createIdentity = (agent: Agent) => (mnemonic: string) => (dispatch: Dispatch) =>
  (agent.identityManager.getIdentityProviders()[0] as RIFIdentityProvider)
    .importMnemonic(mnemonic)
    .then(() => agent.identityManager.createIdentity())
    .then(({ did }) => dispatch(setIdentity({ did })))
