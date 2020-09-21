import { Dispatch } from '@reduxjs/toolkit'
import { Agent, Credential, Message } from 'daf-core'
import { Callback, callbackify } from './util'
import axios from 'axios'
import { ActionSignW3cVc } from 'daf-w3c'
import { addServiceToken } from '../reducers/authentication'

const makeLoginCredentialPayload = (issuer: string, subject: string) => (challenge: string) => {
  if (!challenge) {
    throw new Error('Server did not return any challenge to login')
  }

  return {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer,
    credentialSubject: {
      id: subject,
      claims: [{ claimType: 'challenge', claimValue: challenge }]
    }
  }
}

const verifyServiceDid = (expectedDid: string) => (message: Message): Credential => {
  const credential = message.credentials[0]

  if (credential.issuer.did !== expectedDid) {
    throw new Error('The issuer of the auth credential is not the expected did')
  }

  return credential
}

export const serviceAuthenticationFactory = (agent: Agent) => (serviceUrl: string, serviceDid: string, did: string, cb?: Callback<string>) => (dispatch: Dispatch) => callbackify(
  async () => axios.post(`${serviceUrl}/request-auth`, { did })
    .then(res => res.status === 200 && !!res.data && res.data.challenge)
    .then(challenge => makeLoginCredentialPayload(did, serviceDid)(challenge))
    .then(payload => agent.handleAction({
      type: 'sign.w3c.vc.jwt',
      save: false,
      data: payload
    } as ActionSignW3cVc))
    .then(({ raw }) => axios.post(`${serviceUrl}/auth`, { jwt: raw }))
    .then(res => res.status === 200 && !!res.data && res.data.token)
    .then(token => agent.handleMessage({ raw: token, metaData: [], save: false }))
    .then(message => verifyServiceDid(serviceDid)(message))
    .then(vc => {
      dispatch(addServiceToken({ identity: did, serviceDid: vc.issuer.did, token: vc.raw }))
      return vc.raw
    }),
  cb
)
