import {
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn
} from 'typeorm'
import { Message } from 'daf-core'
import { IssuedCredentialRequestStatus } from '../reducers/issuedCredentialRequests'

type CredentialRequestStatus = IssuedCredentialRequestStatus // | ReceivedCredentialRequestStatus

@Entity()
export class CredentialRequest extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: string

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToOne(message => Message)
  @JoinColumn()
  message!: Message

  @Column()
  status!: CredentialRequestStatus
}
