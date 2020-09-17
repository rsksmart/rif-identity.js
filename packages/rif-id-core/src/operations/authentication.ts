import { Dispatch } from '@reduxjs/toolkit'
import { Agent, Credential, Message } from 'daf-core'
import { Callback, callbackify } from './util'
import axios from 'axios'
import { ActionSignW3cVc } from 'daf-w3c'
import { addServiceToken } from '../reducers/authentication'

export const serviceLoginFactory = (agent: Agent) => (serviceUrl: string, serviceDid: string, did: string, cb?: Callback<string>) => (dispatch: Dispatch) => callbackify(
  async () => {
    const makeLoginCredentialPayload = (challenge: string) => ({
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      issuer: did,
      credentialSubject: {
        id: serviceDid,
        claims: [{ claimType: 'challenge', claimValue: challenge }]
      }
    })

    const verifyServiceDid = (message: Message): Credential => {
      const credential = message.credentials[0]

      if (credential.issuer.did !== serviceDid) {
        throw new Error('The issuer of the auth credential is not the expected did')
      }

      return credential
    }

    return axios.post(`${serviceUrl}/request-auth`, { did })
      .then(res => res.status === 200 && res.data)
      .then(data => data.challenge)
      .then(makeLoginCredentialPayload)
      .then(payload => agent.handleAction({
        type: 'sign.w3c.vc.jwt',
        save: false,
        data: payload
      } as ActionSignW3cVc))
      .then(vc => vc.raw)
      .then(jwt => axios.post(`${serviceUrl}/auth`, { jwt }))
      .then(res => res.status === 200 && res.data)
      .then(data => data.token)
      .then(token => agent.handleMessage({ raw: token, metaData: [], save: false }))
      .then(verifyServiceDid)
      .then(vc => dispatch(addServiceToken(
        { identity: did, serviceDid: vc.issuer.did, token: vc.raw }
      )))
  },
  cb
)
