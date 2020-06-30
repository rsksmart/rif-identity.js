import { generateMnemonic } from '@rsksmart/rif-id-mnemonic'
import RIFIdentity, { RIFIdentityInterface } from './core'
import pipe from 'lodash/fp/pipe'

export const fromMnemonic = (mnemonic: string): RIFIdentityInterface => {
  const identity = new RIFIdentity()

  identity.addMnemonicProviderDefault(mnemonic)

  return identity
}

export const createWithMnemonic = (sentenceLength: number = 12) => pipe(
  generateMnemonic,
  fromMnemonic
)(sentenceLength)
