import {
  Entity,
  Column,
  BaseEntity,
  PrimaryColumn
} from 'typeorm'

@Entity()
export class IdentitySeed extends BaseEntity {
  constructor(did: string, seedHex: string) {
    super()
    this.did = did
    this.seedHex = seedHex
  }

  @PrimaryColumn()
  did: string

  @Column()
  seedHex: string

  @Column()
  derivationCount: number = 0
}

export const Entities = [IdentitySeed]
