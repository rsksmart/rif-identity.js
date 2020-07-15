import { AbstractMessageHandler, Agent } from 'daf-core'
import { RIFIdMessage } from '../entities/message'

export class RIFIdMessageHandler extends AbstractMessageHandler {
  async handle (message: RIFIdMessage, agent: Agent): Promise<RIFIdMessage> {
    const meta = message.getLastMetaData()

    if (meta?.type === 'JWT') {
      if (message.credentials) {
        const credential = message.credentials[0]

        for (let i = 0; i < credential.claims.length; i++) {
          const claim = credential.claims[i]

          switch (claim.type) {
            case 'licenseNumber':
              message.licenseNumber = claim.value
              break
            case 'lastName':
              message.lastName = claim.value
              break
            case 'firstName':
              message.firstName = claim.value
              break
            case 'address':
              message.address = claim.value
              break
            case 'licenseType':
              message.licenseType = claim.value
              break
            case 'bloodType':
              message.bloodType = claim.value
              break
          }
        }
        return message
      }
    }

    return super.handle(message, agent)
  }
}
