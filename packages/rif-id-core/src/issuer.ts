import { RIFIdentityInterface, RIFIdentityStateInterface } from './core'
import { Issuer, JwtCredentialPayload, createVerifiableCredentialJwt } from 'did-jwt-vc'
import { rskDIDFromPrivateKey } from '@rsksmart/rif-id-ethr-did'
import { Store, createStore } from 'redux'
import { issuerReducer } from '@rsksmart/rif-id-core-reducer'
import { JwtCredentialSubject } from 'did-jwt-vc/lib/types'
import { IssuedCredentialsState, addCredentialBySubject, SubjectCredentialsState, getCredentials } from '@rsksmart/rif-id-core-reducer/lib/issuedCredentials'

export interface VerifiableCredentialIssuanceData {
  expirationDate: Date
  claims: JwtCredentialSubject
  subjectDid: string
  issuanceDate?: Date
}

export interface RIFIssuerStateInterface extends RIFIdentityStateInterface {
  issuedCredentials: IssuedCredentialsState
}

export interface RIFIssuerInterface {
  store: Store<RIFIssuerStateInterface>
  createVerifiableCredentialJwt: (data: VerifiableCredentialIssuanceData) => string
  getIssuedCredentials: () => SubjectCredentialsState
}

const RIFIdIssuer = function (this: RIFIssuerInterface, identity: RIFIdentityInterface) {
  this.store = createStore(issuerReducer, identity.store.getState())
} as any as ({ new (identity: RIFIdentityInterface): RIFIssuerInterface;})

RIFIdIssuer.prototype.createVerifiableCredentialJwt = async function (data: VerifiableCredentialIssuanceData) {
  const vcPayload: JwtCredentialPayload = {
    sub: data.subjectDid,
    exp: toUnixTimestamp(data.expirationDate),
    nbf: toUnixTimestamp(data.issuanceDate || new Date()),
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'], // TODO: Add a new context and type
      credentialSubject: data.claims
    }
  }

  const issuer: Issuer = rskDIDFromPrivateKey()('cdb2327689182b196629c48d00f98891645b2ff0596073cfe6d7852db6f5146d') // TODO: Get signer from new identityProvider

  const jwt = await createVerifiableCredentialJwt(vcPayload, issuer)

  addCredentialBySubject(this.store.dispatch)(data.subjectDid, { jwt })

  return jwt
}

RIFIdIssuer.prototype.getIssuedCredentials = function () {
  return getCredentials(this.store.getState().issuedCredentials)
}

export const toUnixTimestamp = (date: Date) => Math.floor(date.getTime() / 1000)

export default RIFIdIssuer
