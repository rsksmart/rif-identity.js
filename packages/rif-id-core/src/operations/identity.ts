import { Agent, AbstractIdentity } from 'daf-core'
import { Dispatch } from '@reduxjs/toolkit'
import { addIdentity } from '../reducers/identitySlice'

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
