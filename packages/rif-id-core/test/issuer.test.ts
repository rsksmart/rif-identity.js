import RIFIdentity from '../src/core'
import RIFIdIssuer, { VerifiableCredentialIssuanceData, toUnixTimestamp } from '../src/issuer'
import { decodeJWT } from 'did-jwt'

const mnemonic = 'egg quote away castle human cluster penalty blood word sweet fall swing'

describe('issuer actions', () => {
  test('create verifiable credential', async () => {
    const expirationDate = new Date(2025, 5, 12)
    const identity = RIFIdentity.fromMnemonic(mnemonic)

    const issuer = new RIFIdIssuer(identity)

    const data: VerifiableCredentialIssuanceData = {
      expirationDate,
      subjectDid: 'did:ethr:0x52aE2e11082f65B00a88095F8e160b8432532522', // TODO: rskdid
      claims: {
        name: 'Name',
        lastName: 'lastName'
      }
    }

    const jwt = await issuer.createVerifiableCredentialJwt(data)

    const decoded = decodeJWT(jwt)

    expect(decoded.header.typ).toEqual('JWT')
    expect(decoded.header.alg).toEqual('ES256K')
    expect(decoded.payload.exp).toEqual(toUnixTimestamp(expirationDate))
    expect(decoded.payload.sub).toEqual(data.subjectDid)
    expect(decoded.signature).toBeTruthy()
  })

  test('get issued credentials', async () => {
    const expirationDate = new Date(2025, 5, 12)
    const identity = RIFIdentity.fromMnemonic(mnemonic)

    const issuer = new RIFIdIssuer(identity)

    const data: VerifiableCredentialIssuanceData = {
      expirationDate,
      subjectDid: 'did:ethr:0x52aE2e11082f65B00a88095F8e160b8432532522', // TODO: rskdid
      claims: {
        name: 'Name',
        lastName: 'lastName'
      }
    }

    await issuer.createVerifiableCredentialJwt(data)

    const issuedCreds = issuer.getIssuedCredentials()

    expect(Object.keys(issuedCreds)).toEqual([data.subjectDid])
    expect(issuedCreds[data.subjectDid][0].jwt).toBeTruthy()
  })
})
