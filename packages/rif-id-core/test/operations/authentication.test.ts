// import { Store, AnyAction, configureStore } from '@reduxjs/toolkit'
// import { generateMnemonic } from '@rsksmart/rif-id-mnemonic'
// import { Agent } from 'daf-core'
// import { createAgent, deleteDatabase } from '../util'
// import authenticationReducer, { AuthenticationState } from '../../src/reducers/authentication'
// import { serviceLoginFactory } from '../../src/operations/authentication'

// describe('authentication operations', () => {
//   let agent: Agent
//   let database: string
//   let store: Store<AuthenticationState, AnyAction>
//   let serviceLogin: ReturnType<typeof serviceLoginFactory>

//   beforeEach(async () => {
//     const mnemonic = generateMnemonic(12)
//     database = `test.rif-id-core.operations.login.${new Date().getTime()}.sqlite`
//     agent = await createAgent(database, { mnemonic })
//     store = configureStore({ reducer: authenticationReducer })
//     serviceLogin = serviceLoginFactory(agent)
//   })

//   afterEach(() => deleteDatabase(agent, database))

//   test('should save a login token', async () => {
//     const identity = await agent.identityManager.createIdentity()
//     const serviceDid = 'did:ethr:rsk:testnet:0x4A795Ab98dC3732D1123c6133D3Efdc76D4c91f8'
//     await serviceLogin('http://localhost:5104', serviceDid, identity.did)(store.dispatch)

//     const state = store.getState()
//     expect(state[identity.did]).toBeTruthy()
//     expect(state[identity.did][serviceDid]).toBeTruthy()
//   })

//   test('should throw an error if not expected service did', async () => {
//     const identity = await agent.identityManager.createIdentity()
//     const serviceDid = 'invalid'

//     await serviceLogin('http://localhost:5104', serviceDid, identity.did)(store.dispatch).catch(e => {
//       expect(e.message).toEqual('The issuer of the auth credential is not the expected did')
//     })
//   })
// })
