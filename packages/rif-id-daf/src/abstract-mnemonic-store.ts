import { IdentityMnemonic } from './entities'

export abstract class AbstractMnemonicStore {
  abstract create(mnemomic: string): Promise<boolean>
  abstract set(id: number, mnemonic: string): Promise<boolean>
  abstract get(): Promise<IdentityMnemonic>
  abstract delete(): Promise<boolean>
  abstract exist(): Promise<boolean>
}
