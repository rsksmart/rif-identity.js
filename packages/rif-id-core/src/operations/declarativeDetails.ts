import { Agent } from 'daf-core'
import { Dispatch } from '@reduxjs/toolkit'
import { callbackify, Callback } from './util'
import { setDeclarativeDetails, DeclarativeDetails } from '../reducers/declarativeDetails'
import { DeclarativeDetail } from '../entities/DeclarativeDetail'

const getID = (did: string, name: string) => `${did}:${name}`

const entityToDeclarativeDetail = (entity: DeclarativeDetail) => {
  const declarativeDetail: DeclarativeDetails = {}
  declarativeDetail[entity.name] = { type: entity.type, value: entity.value }
  return declarativeDetail
}

export const setDeclarativeDetailsFactory = (agent: Agent) => (did: string, declarativeDetails: DeclarativeDetails, cb?: Callback<boolean>) => (dispatch: Dispatch) => callbackify(
  () => agent.dbConnection.then(connection => connection.manager.createQueryBuilder(DeclarativeDetail, 'dl')
    .where('dl.id IN (:...ids)', { ids: Object.keys(declarativeDetails).map(name => getID(did, name)) })
    .getMany()
    .then(entities => {
      const entitiesToSave = []
      const idsOfEntitiesToDelete = []

      for (const [name, declarativeDetail] of Object.entries(declarativeDetails)) {
        const entity = entities.find(entity => entity.name === name)

        if (entity && declarativeDetails[name]) {
          // updates
          entity.type = declarativeDetail.type
          entity.value = declarativeDetail.value
          entitiesToSave.push(entity)
        } else if (declarativeDetails[name]) {
          // creates
          const newEntity = new DeclarativeDetail(did, name, declarativeDetail.type, declarativeDetail.value)
          entitiesToSave.push(newEntity)
        } else {
          // deletes
          idsOfEntitiesToDelete.push(getID(did, name))
        }
      }

      return Promise.all([
        connection.manager.save(entitiesToSave),
        connection.manager.createQueryBuilder()
          .delete()
          .from(DeclarativeDetail, 'dl')
          .where('id IN (:...ids)', { ids: idsOfEntitiesToDelete })
          .execute()
      ])
    }).then(() => {
      dispatch(setDeclarativeDetails({ did, declarativeDetails }))
      return true
    })
  ), cb
)

export const initDeclarativeDetailsFactory = (agent: Agent) => (cb?: Callback<boolean>) => (dispatch: Dispatch) => callbackify(
  () => agent.dbConnection.then(connection => connection.getRepository(DeclarativeDetail).find()
    .then(entities => {
      for (const entity of entities) dispatch(setDeclarativeDetails({ did: entity.did, declarativeDetails: entityToDeclarativeDetail(entity) }))
    })
  ),
  cb
)
