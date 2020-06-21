import { entropyToMnemonic } from 'bip39'
import pipe from 'lodash/fp/pipe'
import { validate } from './util'

export const INVALID_MNEMONIC_SIZE = 'Invalid mnemonic size'

// spec: https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki

/**
 * ENT: entropy length
 * CS: checksum length
 * MS: mnemonic sentence length in words
 *
 * CS = ENT / 32
 * MS = (ENT + CS) / 11
 *
 * MS = (ENT + CS) / 11
 * MS = (ENT + ENT / 32) / 11
 * MS = (33 ENT / 32) / 11
 * MS = 33 ENT / 352
 * 352 MS / 33 = ENT
 * 32 MS / 3 = ENT
 * (32 MS / 3) / 8 = ENT / 8 # to bytes
 * 4 MS / 3 = ENT / 8
 *
*/

const isValidSentenceLength = (sentenceLength: number): boolean => (
  (sentenceLength < 12 || sentenceLength > 24) || (sentenceLength % 3 !== 0)
)

const validateSentenceLength: (sentenceLength: number) => number = validate(isValidSentenceLength)(INVALID_MNEMONIC_SIZE)

const sentenceSizeToEntropyLength = (sentenceLength: number): number => (sentenceLength / 3) * 4

export const calculateEntropyLength: (sentenceLength: number) => number = pipe(
  validateSentenceLength,
  sentenceSizeToEntropyLength
)

export type RNG = () => Buffer | string
type RNGCreator = (rns: RNG) => (sentenceLength: number) => string

export const createMnemonicGenerator: RNGCreator = (rng) => pipe(
  calculateEntropyLength,
  rng,
  entropyToMnemonic
)
