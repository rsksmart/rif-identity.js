import {
  Entity,
  Column,
  BaseEntity,
  PrimaryColumn
} from 'typeorm'

@Entity()
export class DeclarativeDetail extends BaseEntity {
  constructor (did: string, name: string, type: string, value: string) {
    super()
    this.id = `${did}:${name}`
    this.name = name
    this.did = did
    this.type = type
    this.value = value
  }

  @PrimaryColumn({ unique: true })
  id!: string

  @Column()
  did: string

  @Column()
  name: string

  @Column()
  type!: string

  @Column()
  value!: string
}
