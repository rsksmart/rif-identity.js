import { Agent, AbstractIdentity } from 'daf-core'
import { Dispatch } from '@reduxjs/toolkit'
import { addIdentity } from '../reducers/identitySlice'

type Callback<T> = (res?: T, err?: Error) => void

export const initIdentityFactory = (agent: Agent) => (cb?: Callback<AbstractIdentity[]>) => (dispatch: Dispatch) => {
  let _initIdentityFactory = () => agent.identityManager.getIdentities()
    .then(identities => {
      identities.forEach(({ did }) => dispatch(addIdentity({ did })))
      if(cb) cb(identities, undefined)
      else return identities
    })

  return !!cb ? _initIdentityFactory().catch(error => {
    cb(undefined, error)
  }) : _initIdentityFactory()
}

export const createIdentityFactory = (agent: Agent) => () => (dispatch: Dispatch) => agent.identityManager.createIdentity()
  .then(identity => {
    dispatch(addIdentity({ did: identity.did }))
    return identity
  })
