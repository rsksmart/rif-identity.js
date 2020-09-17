
import { Dispatch } from '@reduxjs/toolkit'
import { Agent } from 'daf-core'
import { SelectiveDisclosureRequest } from 'daf-selective-disclosure'
import { ActionSendDIDComm } from 'daf-did-comm'
import { addIssuedCredentialRequest, Claims, IssuedCredentialRequest, setIssuedCredentialRequestStatus, deleteIssuedCredentialRequest } from '../reducers/issuedCredentialRequests'
import { CredentialRequest } from '../entities/CredentialRequest'
import { callbackify, Callback } from './util'

export const defaultIssuedCredentialRequestStatus = 'pending'

export const issueCredentialRequestFactory = (agent: Agent) => (from: string, to: string, claims: Claims, url?: string, cb?: Callback<IssuedCredentialRequest>) => (dispatch: Dispatch): IssuedCredentialRequest => callbackify(
  () => agent.handleAction({
    type: 'sign.sdr.jwt',
    data: {
      issuer: from,
      subject: to,
      claims
    } as SelectiveDisclosureRequest
  }).then(jwt => agent.handleAction({
    type: 'send.message.didcomm-alpha-1',
    data: {
      from,
      to,
      type: 'jwt',
      body: jwt
    },
    url,
    save: true
  } as ActionSendDIDComm)
  ).then(message => {
    if (!message) throw new Error('Failed to send credential request')
    return agent.dbConnection.then(connection => ({ connection, message }))
  }).then(({ connection, message }) => {
    const credentialRequest = new CredentialRequest()
    credentialRequest.message = message
    credentialRequest.status = defaultIssuedCredentialRequestStatus
    return connection.getRepository(CredentialRequest).save(credentialRequest)
  }).then(credentialRequest => {
    const addIssuedCredentialRequestPayload = {
      from,
      id: credentialRequest.id,
      to,
      claims
    }
    dispatch(addIssuedCredentialRequest(addIssuedCredentialRequestPayload))
    return addIssuedCredentialRequestPayload
  }),
  cb
)

export const setIssuedCredentialRequestStatusFactory = (agent: Agent) => (from: string, id: string, status: string, cb?: Callback<void>) => (dispatch: Dispatch) => callbackify(
  async () => {
    const connection = await agent.dbConnection
    const credentialRequest = await connection.getRepository(CredentialRequest).findOne(id)
    credentialRequest.status = status
    await connection.manager.save(credentialRequest)
    dispatch(setIssuedCredentialRequestStatus({ from, id, status }))
  },
  cb
)

export const deleteIssuedCredentialRequestFactory = (agent: Agent) => (from: string, id: string, cb?: Callback<void>) => (dispatch: Dispatch) => callbackify(
  () => agent.dbConnection.then(connection => connection.manager.createQueryBuilder()
    .delete()
    .from(CredentialRequest)
    .where('id = :id', { id })
    .execute()
  ).then(() => dispatch(deleteIssuedCredentialRequest({ from, id }))),
  cb
)
