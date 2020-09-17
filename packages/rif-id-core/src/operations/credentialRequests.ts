
import { Dispatch } from '@reduxjs/toolkit'
import { Agent } from 'daf-core'
import { SelectiveDisclosureRequest } from 'daf-selective-disclosure'
import { ActionSendDIDComm } from 'daf-did-comm'
import { addIssuedCredentialRequest, Claims, IssuedCredentialRequest, IssuedCredentialRequestStatus } from '../reducers/issuedCredentialRequests'
import { CredentialRequest } from '../entities/CredentialRequest'
import { callbackify, Callback } from './util'

export const defaultIssuedCredentialRequestStatus: IssuedCredentialRequestStatus = 'pending'

export const issueCredentialRequestFactory = (agent: Agent) => (from: string, to: string, claims: Claims, url?: string, cb?: Callback<IssuedCredentialRequest>) => (dispatch: Dispatch) => callbackify(
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
      messageId: credentialRequest.message.id,
      to,
      claims
    }
    dispatch(addIssuedCredentialRequest(addIssuedCredentialRequestPayload))
    return addIssuedCredentialRequestPayload
  }),
  cb
)
