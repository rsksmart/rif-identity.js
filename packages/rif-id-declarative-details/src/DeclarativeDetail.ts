import {
  Entity,
  Column,
  BaseEntity,
  PrimaryGeneratedColumn
} from 'typeorm'

@Entity()
export class DeclarativeDetail extends BaseEntity {
  constructor(name: string, type: string, value: string) {
    super()
    this.name = name
    this.type = type
    this.value = value
  }

  @PrimaryGeneratedColumn()
  id!: string

  @Column({ unique: true })
  name!: string

  @Column()
  type!: string

  @Column()
  value!: string
}
