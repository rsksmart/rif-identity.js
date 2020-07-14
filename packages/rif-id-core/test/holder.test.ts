import RIFIdentity from '../src/core'
import RIFIdHolder from '../src/holder'
import { Credential } from '@rsksmart/rif-id-core-reducer/lib/receivedCredentials'

const mnemonic = 'egg quote away castle human cluster penalty blood word sweet fall swing'
const subject = 'did:ethr:0x52aE2e11082f65B00a88095F8e160b8432532522'
const issuer = 'did:ethr:0x16e3Df3c58E42dd92411E0b961e8d3e0C0238e5C'

describe('issuer actions', () => {
  test('add received credential', async () => {
    const identity = RIFIdentity.fromMnemonic(mnemonic)

    const holder = new RIFIdHolder(identity)

    const credential: Credential = {
      id: 'id1',
      subject,
      issuer,
      claims: {
        name: 'Alice'
      },
      issuanceDate: new Date(),
      context: ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      hash: 'test'
    }

    holder.addReceivedCredential(credential)

    const received = holder.getReceivedCredentials()

    expect(received).toEqual([credential])
  })
})
