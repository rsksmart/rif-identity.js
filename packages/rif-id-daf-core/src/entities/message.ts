import { Message } from 'daf-core'
import { Entity, Column } from 'typeorm'

@Entity()
export class RIFIdMessage extends Message {
  @Column({ nullable: true })
  licenseNumber?: string

  @Column({ nullable: true })
  lastName?: string

  @Column({ nullable: true })
  firstName?: string

  @Column({ nullable: true })
  address?: string

  @Column({ nullable: true })
  licenseType?: string

  @Column({ nullable: true })
  bloodType?: string
}
