import { Agent, AbstractIdentity } from 'daf-core'
import { Dispatch } from '@reduxjs/toolkit'
import { addIdentity, deleteIdentity } from '../reducers/identitySlice'

type Callback<T> = (err?: Error, res?: T) => void

const callbackify = (promise, cb) => cb ? promise().then(res => cb(undefined, res)).catch(err => cb(err, undefined)) : promise()

export const initIdentityFactory = (agent: Agent) => (cb?: Callback<AbstractIdentity[]>) => (dispatch: Dispatch) => callbackify(
  () => agent.identityManager.getIdentities()
    .then(identities => {
      identities.forEach(({ did }) => dispatch(addIdentity({ did })))
      return identities
    }), cb
)

export const createIdentityFactory = (agent: Agent) => (cb?: Callback<AbstractIdentity>) => (dispatch: Dispatch) => callbackify(
  () => agent.identityManager.createIdentity()
    .then(identity => {
      dispatch(addIdentity({ did: identity.did }))
      return identity
    }), cb
)

export const deleteIdentityFactory = (agent: Agent) => (identityProviderType: string, did: string, cb?: Callback<void>) => (dispatch: Dispatch) => callbackify(
  () => agent.identityManager.deleteIdentity(identityProviderType, did) // the rif identity provider is of type 'ethr-did' - this can be extended
  .then(success => {
    if (!success) throw new Error(`Error deleting identity ${did}`)
    dispatch(deleteIdentity({ did }))
    return true
  }), cb
)
