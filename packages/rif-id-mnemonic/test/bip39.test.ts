import concat from 'lodash/concat'
import { calculateEntropyLength, createMnemonicGenerator, INVALID_MNEMONIC_SIZE } from '../src/bip39'
import customTestVectors from './bip39.vectors.custom.json'
import trezorTestVectors from './bip39.vectors.trezor.json'

const testVectors = concat(customTestVectors, trezorTestVectors)

/**
 * |  ENT  | CS | ENT+CS |  MS  |
 * +-------+----+--------+------+
 * |  128  |  4 |   132  |  12  |
 * |  160  |  5 |   165  |  15  |
 * |  192  |  6 |   198  |  18  |
 * |  224  |  7 |   231  |  21  |
 * |  256  |  8 |   264  |  24  |
 */
describe('calculate entropy size', () => {
  test.each([[12, 128 / 8], [15, 160 / 8], [18, 192 / 8], [21, 224 / 8], [24, 256 / 8]])(
    'mnemonic size: %i - valid', (ms, ent) => {
      const length = calculateEntropyLength(ms)
      expect(length).toBe(ent)
    })

  test.each([[2], [4], [8], [11], [13], [25], [28], [48]])(
    'mnemonic size: %i - invalid', (ms) => {
      expect(() => calculateEntropyLength(ms)).toThrowError(INVALID_MNEMONIC_SIZE)
    })
})

describe('mnemonic generator', () => {
  test.each(testVectors)('test case %#', (entropy, _, mnemonic) => {
    const generateMnemonic = createMnemonicGenerator(() => entropy)
    const { length } = mnemonic.split(' ')
    expect(generateMnemonic(length)).toBe(mnemonic)
  })
})
