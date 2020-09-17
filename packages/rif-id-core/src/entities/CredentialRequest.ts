import {
  Connection,
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn, Repository
} from 'typeorm'
import { Message } from 'daf-core'

@Entity()
export class CredentialRequest extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: string

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToOne(message => Message)
  @JoinColumn()
  message!: Message

  @Column()
  status!: string
}

export const findOneCredentialRequest = (connection: Connection, id: string) => connection.getRepository(CredentialRequest).findOne(id, { relations: [connection.getRepository(Message).metadata.tableName] })
