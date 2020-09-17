import { Message } from 'daf-core'
import fs from 'fs'
import { createSqliteConnection } from '../util'
import { CredentialRequest, findOneCredentialRequest, findCredentialRequests } from '../../src/entities'

test('credential requests entity', async () => {
  const database = `rif-id-core.test.entities.cred-reqs.${+new Date()}.sqlite`
  const connection = await createSqliteConnection(database, false, true)

  const message = new Message()
  message.id = 'id'
  message.raw = 'mock'
  message.type = 'mock'
  message.createdAt = new Date()
  await connection.manager.save(message)

  const credentialRequest = new CredentialRequest()
  credentialRequest.message = message
  credentialRequest.status = 'pending'
  await connection.manager.save(credentialRequest)

  const resultingCredentialRequest = await findOneCredentialRequest(connection, credentialRequest.id)

  expect(resultingCredentialRequest.message.id).toEqual(message.id)
  expect(resultingCredentialRequest.status).toEqual('pending')

  const credentialRequestRepository = await connection.getRepository(CredentialRequest)

  await credentialRequestRepository.createQueryBuilder()
    .delete()
    .from(CredentialRequest)
    .where('id = :id', { id: credentialRequest.id })
    .execute()

  expect(await findCredentialRequests(connection)).toHaveLength(0)

  await connection.close()
  fs.unlinkSync(database)
})
