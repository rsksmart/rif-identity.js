import {
  Entity,
  Column,
  BaseEntity,
  PrimaryColumn,
  Generated
} from 'typeorm'

@Entity()
export class IdentityMnemonic extends BaseEntity {
  constructor (mnemonic: string) {
    super()
    this.mnemonic = mnemonic
  }

  @PrimaryColumn()
  @Generated('increment')
  id: number

  @Column()
  mnemonic: string

  @Column()
  derivationCount: number = 0
}

export const Entities = [IdentityMnemonic]
