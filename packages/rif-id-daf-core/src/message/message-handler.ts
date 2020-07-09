import { AbstractMessageHandler, Agent } from 'daf-core'
import { RIFIdMessage } from '../entities/message'

export class RIFIdMessageHandler extends AbstractMessageHandler {
  async handle (message: RIFIdMessage, agent: Agent): Promise<RIFIdMessage> {
    const meta = message.getLastMetaData()

    if (meta?.type === 'JWT') {
      if (message.credentials) {
        const credential = message.credentials[0]

        message.licenseNumber = credential.claims.find(claim => claim.type === 'licenseNumber')?.value
        message.lastName = credential.claims.find(claim => claim.type === 'lastName')?.value
        message.firstName = credential.claims.find(claim => claim.type === 'firstName')?.value
        message.address = credential.claims.find(claim => claim.type === 'address')?.value
        message.licenseType = credential.claims.find(claim => claim.type === 'licenseType')?.value
        message.bloodType = credential.claims.find(claim => claim.type === 'bloodType')?.value

        return message
      }
    }

    return super.handle(message, agent)
  }
}
