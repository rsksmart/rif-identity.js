import { Message, Agent, Credential, Identity } from 'daf-core'
import { JwtCredentialPayload } from 'did-jwt-vc'
import { RIFIdMessageHandler } from '../src/index'

describe('daf-w3c', () => {
  const claims = {
    licenseNumber: 'COU-1234567890',
    address: 'This is an address',
    firstName: 'Test',
    lastName: 'LastName',
    bloodType: 'A+',
    licenseType: 'B1'
  }

  const vcJwt =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE1OTQyNDgxOTYsInN1YiI6ImRpZDpldGhyOnJpbmtlYnk6MHg1MmFFMmUxMTA4MmY2NUIwMGE4ODA5NUY4ZTE2MGI4NDMyNTMyNTIyIiwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiXSwidHlwZSI6WyJWZXJpZmlhYmxlQ3JlZGVudGlhbCJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJsaWNlbnNlTnVtYmVyIjoiQ09VLTEyMzQ1Njc4OTAiLCJhZGRyZXNzIjoiVGhpcyBpcyBhbiBhZGRyZXNzIiwiZmlyc3ROYW1lIjoiVGVzdCIsImxhc3ROYW1lIjoiTGFzdE5hbWUiLCJibG9vZFR5cGUiOiJBKyIsImxpY2Vuc2VUeXBlIjoiQjEifX0sImlzcyI6ImRpZDpldGhyOjB4MTZlM0RmM2M1OEU0MmRkOTI0MTFFMGI5NjFlOGQzZTBDMDIzOGU1QyJ9.uSQK1wx2jfv73XWl1pZ3egGIj8HW3-iWBS3cM3k_RX08Ol3rqGhLApoTTv1pBgkTaRHrfEVkTIll9aur5zgoYQE'

  const vcPayload = {
    iat: 1594248196,
    sub: 'did:ethr:rinkeby:0x52aE2e11082f65B00a88095F8e160b8432532522',
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      credentialSubject: claims
    },
    iss: 'did:ethr:rinkeby:0x16e3Df3c58E42dd92411E0b961e8d3e0C0238e5C'
  }

  function createCredential (payload: JwtCredentialPayload, jwt: string): Credential {
    const vc = new Credential()

    vc.issuer = new Identity()
    vc.issuer.did = payload.iss!

    vc.subject = new Identity()
    vc.subject.did = payload.sub

    vc.raw = jwt
    vc.issuanceDate = timestampToDate(payload.iat)

    vc.context = payload.vc['@context'] as string[]
    vc.type = payload.vc.type as string[]

    vc.credentialSubject = payload.vc.credentialSubject

    return vc
  }

  function timestampToDate (timestamp: number): Date {
    const date = new Date(0)
    date.setUTCSeconds(timestamp)
    return date
  }

  const handler = new RIFIdMessageHandler()

  const agent = new Agent({
    identityProviders: [],
    serviceControllers: [],
    messageHandler: handler,
    didResolver: {
      resolve: async (did: string) => ({
        '@context': 'https://w3id.org/did/v1',
        id: did,
        publicKey: [
          {
            id: `${did}#owner`,
            type: 'Secp256k1VerificationKey2018',
            owner: did,
            ethereumAddress: '0x16e3Df3c58E42dd92411E0b961e8d3e0C0238e5C'
          }
        ],
        authentication: [
          {
            type: 'Secp256k1SignatureAuthentication2018',
            publicKey: `${did}#owner`
          }
        ]
      })
    }
  })

  it('should populate the desired fields', async () => {
    const message = new Message({ raw: vcJwt, metaData: [{ type: 'JWT', value: 'ES256K-R' }] })

    message.data = vcPayload
    message.credentials = [createCredential(vcPayload, vcJwt)]

    const handled = await handler.handle(message, agent)

    expect(handled.isValid()).toEqual(true)
    expect(handled.licenseNumber).toEqual(claims.licenseNumber)
    expect(handled.address).toEqual(claims.address)
    expect(handled.bloodType).toEqual(claims.bloodType)
    expect(handled.firstName).toEqual(claims.firstName)
    expect(handled.lastName).toEqual(claims.lastName)
    expect(handled.licenseType).toEqual(claims.licenseType)
  })
})
