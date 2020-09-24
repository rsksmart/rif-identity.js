import {
  ecKeyFromPrivate,
  publicFromEcKey,
  ethereumDigestFromPublicKey,
  rskAddressFromEthereumDigest,
  rskAddressFromPrivateKey,
  rskTestnetAddressFromEthereumDigest,
  rskTestnetAddressFromPrivateKey,
} from '../src/rskAddress'

const privateKey = '139d64ebceeb8b7702104a13d1d041303bd4a2f42090fa8c0b11c89cb97a5b24'
const expectedRSKAddress = '0x285b30492a3F444D78f75261a35cB292Fc8F41a6'
const expectedRSKTestnetAddress = '0x285B30492a3F444d78f75261A35cB292Fc8F41A6'

describe.each([
  ['rsk', expectedRSKAddress, rskAddressFromEthereumDigest, rskAddressFromPrivateKey],
  ['rsk testnet', expectedRSKTestnetAddress, rskTestnetAddressFromEthereumDigest, rskTestnetAddressFromPrivateKey]
])('%s address', (_, expectedAddress, addressFromEthereumDigest, addressFromPrivateKey) => {
  test('staged', () => {
    const ecKey = ecKeyFromPrivate(privateKey)

    expect(ecKey.getPublic().encode('hex', true)).toBe('03919eff5b41cb1b4ded547cdcf0cef1810218cb393e26b8929625999f7ddbfcdd')

    const publicKey = publicFromEcKey(ecKey)

    const digest = ethereumDigestFromPublicKey(publicKey)
    expect(digest).toBe(expectedAddress.slice(2).toLowerCase())

    const address = addressFromEthereumDigest(digest)
    expect(address).toBe(expectedAddress)
  })

  test('piped', () => {
    const address = addressFromPrivateKey(privateKey)
    expect(address).toBe(expectedAddress)
  })
})
