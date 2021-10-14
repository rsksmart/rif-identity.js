import randomBytes from 'randombytes'
import { createMnemonicGenerator, RNG } from './bip39'

export const generateMnemonic = createMnemonicGenerator(randomBytes as RNG)

export { mnemonicToSeed, mnemonicToSeedSync } from 'bip39'

export { BIP32Interface, fromSeed } from 'bip32'
export { seedToRSKHDKey } from './bip44'
