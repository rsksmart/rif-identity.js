import { seedToRSKHDKey, seedToRSKTestnetHDKey } from '../src/bip44'
import customTestVectors from './bip44.vectors.custom.json'
import customTestVectorsTestnet from './bip44.vectors.testnet.custom.json'

describe('seed to rsk hdKey', () => {
  describe.each([{
    customTestVectors,
    derivationFn: seedToRSKHDKey
  }, {
    customTestVectors: customTestVectorsTestnet,
    derivationFn: seedToRSKTestnetHDKey
  }])('networks %#', ({ customTestVectors, derivationFn }) => {
    describe.each(customTestVectors)('main path case %#', testVectors => {
      const [seed, derivations] = testVectors as any[]

      const buf = Buffer.from(seed as unknown as string, 'hex')
      const hdKey = derivationFn(buf)

      const cast = (_i: any, _hardened: any, _pk: any) => ({
        i: _i as unknown as number,
        hardened: _hardened as unknown as boolean,
        pk: _pk as unknown as string
      })

      it.each(derivations as unknown as any[][])('derivation path case %#', (_i: any, _hardened: any, _pk: any) => {
        const { i, hardened, pk } = cast(_i, _hardened, _pk)
        const derivedKey = (
          hardened
            ? hdKey.deriveHardened(i)
            : hdKey.derive(i)
        )
        expect(derivedKey.privateKey?.toString('hex')).toBe(pk)
      })
    })
  })
})
