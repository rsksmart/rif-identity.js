import { Agent } from 'daf-core'
import { Dispatch } from '@reduxjs/toolkit'
import { callbackify, Callback } from './util'
import { setDeclarativeDetails, DeclarativeDetails } from '../reducers/declarativeDetails'
import { DeclarativeDetail } from '../entities/DeclarativeDetail'

export const setDeclarativeDetailsFactory = (agent: Agent) => (did: string, declarativeDetails: DeclarativeDetails, cb?: Callback<boolean>) => (dispatch: Dispatch) => callbackify(
  () => {
    const entities = []
    for (const name in Object.keys(declarativeDetails)) {
      const declarativeDetail = declarativeDetails[name]
      entities.push(new DeclarativeDetail(did, name, declarativeDetail.type, declarativeDetail.value))
    }

    return agent.dbConnection.then(connection => {
      connection.getRepository(DeclarativeDetail).save(entities).then(() => {
        dispatch(setDeclarativeDetails({ did, declarativeDetails }))
      })
    })
  }, cb
)
