import { Agent, AbstractIdentity } from 'daf-core'
import { Dispatch } from '@reduxjs/toolkit'
import { addIdentity, deleteIdentity, deleteAllIdentities } from '../reducers/identitySlice'

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
  () => agent.identityManager.deleteIdentity(identityProviderType, did)
  .then(success => {
    if (!success) throw new Error(`Error deleting identity ${did}`)
    dispatch(deleteIdentity({ did }))
    return true
  }), cb
)

export const deleteAllIdentitiesFactory = (agent: Agent) => (identityProviderType: string, cb?: Callback<void>) => (dispatch: Dispatch) => callbackify(
  () => {
    const identityProvider = agent.identityManager.getIdentityProvider(identityProviderType)

    return identityProvider.getIdentities()
      .then(identities => Promise.all(identities.map(({ did }) => identityProvider.deleteIdentity(did))))
      .then(successes => {
        if (successes.filter(success => !success).length > 0) throw new Error(`Error deleting identities`)
        dispatch(deleteAllIdentities())
        return successes
      })
  }, cb
)
