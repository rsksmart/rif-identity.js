import { fromSeed, BIP32Interface } from 'bip32'

const RSK_CHANGE_ACCOUNT_PATH = 'm/44\'/137\'/0\'/0'
const RSK_TESTNET_CHANGE_ACCOUNT_PATH = 'm/44\'/37310\'/0\'/0'

export const seedToRSKHDKey: (seed: Buffer) => BIP32Interface = (seed) => fromSeed(seed).derivePath(RSK_CHANGE_ACCOUNT_PATH)
export const seedToRSKTestnetHDKey: (seed: Buffer) => BIP32Interface = (seed) => fromSeed(seed).derivePath(RSK_TESTNET_CHANGE_ACCOUNT_PATH)
