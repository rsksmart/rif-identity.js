import {
  Entity,
  Column,
  BaseEntity,
  PrimaryGeneratedColumn,
  PrimaryColumn
} from 'typeorm'

@Entity()
export class DeclarativeDetail extends BaseEntity {
  constructor(name: string, type: string, value: string) {
    super()
    this.name = name
    this.type = type
    this.value = value
  }

  @PrimaryColumn({ unique: true })
  name!: string

  @Column()
  type!: string

  @Column()
  value!: string
}
