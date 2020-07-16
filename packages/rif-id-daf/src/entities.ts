import {
  Entity,
  Column,
  BaseEntity,
  PrimaryColumn,
  Generated
} from 'typeorm'

@Entity()
export class IdentitySeed extends BaseEntity {
  constructor(seedHex: string) {
    super()
    this.seedHex = seedHex
  }

  @PrimaryColumn()
  @Generated('increment')
  id: string

  @Column()
  seedHex: string

  @Column()
  derivationCount: number = 0
}

export const Entities = [IdentitySeed]
