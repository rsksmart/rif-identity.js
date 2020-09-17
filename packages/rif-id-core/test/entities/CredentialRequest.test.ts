import { Message } from 'daf-core'
import fs from 'fs'
import { createSqliteConnection } from '../util'
import { CredentialRequest } from '../../src/entities'

test('credential requests entity', async () => {
  const database = `rif-id-core.test.entities.cred-reqs.${+new Date()}.sqlite`
  const connection = await createSqliteConnection(database, false, true)

  const messageRepository = await connection.getRepository(Message)

  const message = new Message()
  message.id = 'id'
  message.raw = 'mock'
  message.type = 'mock'
  message.createdAt = new Date()

  await messageRepository.save(message)

  const resultingMessage = await messageRepository.find().then(messages => messages[0])

  const credentialRequest = new CredentialRequest()
  credentialRequest.message = resultingMessage
  credentialRequest.status = 'pending'
  await connection.manager.save(credentialRequest)

  const credentialRequestRepository = await connection.getRepository(CredentialRequest)
  const resultingCredentialRequest = await credentialRequestRepository.findOne(credentialRequest.id, { relations: [messageRepository.metadata.tableName] })

  expect(resultingCredentialRequest.message.id).toEqual(message.id)
  expect(resultingCredentialRequest.status).toEqual('pending')

  await credentialRequestRepository.createQueryBuilder()
    .delete()
    .from(CredentialRequest)
    .where('id = :id', { id: credentialRequest.id })
    .execute()

  expect(await credentialRequestRepository.find()).toHaveLength(0)

  await connection.close()
  fs.unlinkSync(database)
})
