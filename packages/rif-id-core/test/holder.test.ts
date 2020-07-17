import RIFIdHolder from '../src/holder'
import { Credential } from '@rsksmart/rif-id-core-reducer/lib/receivedCredentials'
import setupAgent from './agent'
import { ActionSignW3cVc, ActionTypes } from 'daf-w3c'
import { Credential as DafCredential } from 'daf-core'

describe('issuer actions', () => {
  test('add received credential', async () => {
    const agent = await setupAgent('sarasa.sqlite')

    const holder = new RIFIdHolder(agent)

    const subject = (await agent.identityManager.createIdentity()).did

    const credential: Credential = {
      id: 'id1',
      subject,
      issuer: 'did:ethr:0x16e3Df3c58E42dd92411E0b961e8d3e0C0238e5C',
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

    await (await agent.dbConnection).close()
  })

  test('receive validatedMessage', async () => {
    const issuerAgent = await setupAgent('issuer.sqlite')
    const holderAgent = await setupAgent('holder.sqlite')

    const holder = new RIFIdHolder(holderAgent)

    const holderIdentity = await holderAgent.identityManager.createIdentity()
    const issuerIdentity = await issuerAgent.identityManager.createIdentity()

    const credentialSubject = {
      id: holderIdentity.did,
      name: 'Alice'
    }

    const data = {
      issuer: issuerIdentity.did,
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      credentialSubject
    }

    const signAction: ActionSignW3cVc = {
      type: ActionTypes.signCredentialJwt,
      data
    }

    const credential: DafCredential = await issuerAgent.handleAction(signAction)

    await holderAgent.handleMessage({ raw: credential.raw })

    const received = holder.getReceivedCredentials()

    expect(received.length).toBe(1)
    expect(received[0].issuer).toEqual(data.issuer)
    expect(received[0].subject).toEqual(credentialSubject.id)

    await (await holderAgent.dbConnection).close()
    await (await issuerAgent.dbConnection).close()
  }, 10000)
})
