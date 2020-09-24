import { Agent, Claim, Credential as DafCredential } from 'daf-core'
import { Callback, callbackify } from './util'
import { Dispatch } from '@reduxjs/toolkit'
import { addCredential, Credential, removeCredential } from '../reducers/credentials'

const entityToCredential = (entity: DafCredential): Credential => ({
  issuer: entity.issuer.did,
  subject: entity.subject?.did,
  issuanceDate: entity.issuanceDate.getTime(),
  expirationDate: entity.expirationDate?.getTime(),
  hash: entity.hash,
  credentialSubject: entity.credentialSubject,
  context: entity.context,
  type: entity.type,
  raw: entity.raw
})

export const receiveCredentialFactory = (agent: Agent) => (jwt: string, cb?: Callback<DafCredential>) => (dispatch: Dispatch) => callbackify(
  () => agent.handleMessage({ raw: jwt, metaData: [] })
    .then(message => dispatch(
      addCredential({ credential: entityToCredential(message.credentials[0]) })
    )),
  cb
)

export const deleteCredentialFactory = (agent: Agent) => (subject: string, hash: string, cb?: Callback<DafCredential>) => (dispatch: Dispatch) => callbackify(
  async () => {
    const connection = await agent.dbConnection
    const credential = await connection.getRepository(DafCredential).findOne(hash)

    await connection.getRepository(Claim).delete({ credential })
    await connection.getRepository(DafCredential).delete({ hash })

    return dispatch(removeCredential({ subject, hash }))
  },
  cb
)

export const initCredentialsFactory = (agent: Agent) => (cb?: Callback<DafCredential[]>) => (dispatch: Dispatch) => callbackify(
  () => agent.dbConnection.then(connection => connection.getRepository(DafCredential).find()
    .then(entities => {
      for (const entity of entities) dispatch(addCredential({ credential: entityToCredential(entity) }))
    })
  ),
  cb
)
