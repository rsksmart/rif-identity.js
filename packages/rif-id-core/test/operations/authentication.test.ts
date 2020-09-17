import { Store, AnyAction, configureStore } from '@reduxjs/toolkit'
import { generateMnemonic } from '@rsksmart/rif-id-mnemonic'
import { AbstractIdentity, Agent } from 'daf-core'
import { createAgent, deleteDatabase, did, issueTestCredential } from '../util'
import authenticationReducer, { AuthenticationState } from '../../src/reducers/authentication'
import { serviceLoginFactory } from '../../src/operations/authentication'
import axios from 'axios'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const mockAxios = (
  expectedServiceUrl: string, challenge: string, token?: string
) => {
  const mockedImplementation = (url: string) => {
    expect(url.startsWith(expectedServiceUrl)).toBeTruthy()

    let data
    if (url.indexOf('/request-auth') > -1) {
      data = { challenge }
    } else if (url.indexOf('/auth') > -1) {
      data = { token }
    } else {
      return Promise.resolve({ status: 404 })
    }
    return Promise.resolve({
      data,
      status: 200,
      statusText: 'OK'
    })
  }

  if (token) {
    return mockedAxios.post
      .mockImplementationOnce(mockedImplementation)
      .mockImplementationOnce(mockedImplementation)
  }

  return mockedAxios.post.mockImplementationOnce(mockedImplementation)
}

describe('authentication operations', () => {
  let agent: Agent
  let database: string
  let store: Store<AuthenticationState, AnyAction>
  let serviceLogin: ReturnType<typeof serviceLoginFactory>
  let identity: AbstractIdentity
  const serviceUrl = 'https://the.service'

  beforeEach(async () => {
    const mnemonic = generateMnemonic(12)
    database = `test.rif-id-core.operations.login.${new Date().getTime()}.sqlite`
    agent = await createAgent(database, { mnemonic })
    store = configureStore({ reducer: authenticationReducer })
    serviceLogin = serviceLoginFactory(agent)

    identity = await agent.identityManager.createIdentity()
  })

  afterEach(() => deleteDatabase(agent, database))

  test('should save a login token', async () => {
    const testCredential = await issueTestCredential(identity.did)
    const challengeToReturn = '123456789qwerty'
    const tokenToReturn = testCredential.raw
    mockAxios(serviceUrl, challengeToReturn, tokenToReturn)

    await serviceLogin(serviceUrl, testCredential.issuer.did, identity.did)(store.dispatch)

    const state = store.getState()
    expect(state[identity.did]).toBeTruthy()
    expect(state[identity.did][testCredential.issuer.did]).toEqual(tokenToReturn)
  })

  test('should throw an error if not expected service did', async () => {
    const testCredential = await issueTestCredential(identity.did)
    const challengeToReturn = '123456789qwerty'
    const tokenToReturn = testCredential.raw

    mockAxios(serviceUrl, challengeToReturn, tokenToReturn)

    const notServiceDid = did

    await serviceLogin(serviceUrl, notServiceDid, identity.did)(store.dispatch).catch(e => {
      expect(e.message).toEqual('The issuer of the auth credential is not the expected did')
    })
  })

  test('should throw an error if the server does not send a proper challenge', async () => {
    const challengeToReturn = undefined

    mockAxios(serviceUrl, challengeToReturn)

    await serviceLogin(serviceUrl, 'does not matter', identity.did)(store.dispatch).catch(e => {
      expect(e.message).toEqual('Server did not return any challenge to login')
    })
  })

  test('should throw the agent error if received invalid token', async () => {
    const challengeToReturn = '123456789qwerty'
    const tokenToReturn = 'invalid'
    mockAxios(serviceUrl, challengeToReturn, tokenToReturn)

    await serviceLogin(serviceUrl, 'does not matter', identity.did)(store.dispatch).catch(e => {
      expect(e.message).toContain('Unsupported message type')
    })
  })

  test
    .each(['400', '401', '404', '500'])('should throw the axios error %s', async (errorCode: string) => {
      // emulates the error thrown in https://github.com/axios/axios/blob/master/lib/core/settle.js#L18
      const axiosError = `Request failed with status code ${errorCode}`
      mockedAxios.post.mockImplementationOnce(() => {
        return Promise.reject(new Error(axiosError))
      })

      await serviceLogin(serviceUrl, 'does not matter', identity.did)(store.dispatch).catch(e => {
        expect(e.message).toEqual(axiosError)
      })
    })
})
