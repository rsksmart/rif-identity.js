import {
  Connection,
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn
} from 'typeorm'
import { Message } from 'daf-core'

@Entity()
export class CredentialRequest extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: string

  // docs: https://github.com/typeorm/typeorm/blob/master/docs/one-to-one-relations.md
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToOne(message => Message)
  @JoinColumn()
  message!: Message

  @Column()
  status!: string
}

export const findOneCredentialRequest = (connection: Connection, id: string) => connection.getRepository(CredentialRequest).findOne(id, { relations: [connection.getRepository(Message).metadata.tableName] })
export const findCredentialRequests = (connection: Connection) => connection.getRepository(CredentialRequest).find()
