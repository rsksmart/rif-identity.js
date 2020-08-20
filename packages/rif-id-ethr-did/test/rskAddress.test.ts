import {
  ecKeyFromPrivate,
  publicFromEcKey,
  ethereumDigestFromPublicKey,
  rskAddressFromEthereumDigest,
  rskAddressFromPrivateKey
} from '../src/rskAddress'

describe('rsk address', () => {
  test('staged', () => {
    const privateKey = '139d64ebceeb8b7702104a13d1d041303bd4a2f42090fa8c0b11c89cb97a5b24'
    const expectedAddress = '0x285b30492a3F444D78f75261a35cB292Fc8F41a6'

    const ecKey = ecKeyFromPrivate(privateKey)

    expect(ecKey.getPublic().encode('hex', true)).toBe('03919eff5b41cb1b4ded547cdcf0cef1810218cb393e26b8929625999f7ddbfcdd')

    const publicKey = publicFromEcKey(ecKey)

    const digest = ethereumDigestFromPublicKey(publicKey)
    expect(digest).toBe(expectedAddress.slice(2).toLowerCase())

    const address = rskAddressFromEthereumDigest(digest)
    expect(address).toBe(expectedAddress)
  })

  test('piped', () => {
    const privateKey = '82f706da7850faa01ec568897c39dd0fc7f21d3abed85291105327fe57b25623'
    const expectedAddress = '0xda8D79dde799e3FBF0053B7a3aFA6a5D6123cd46'

    const address = rskAddressFromPrivateKey(privateKey)
    expect(address).toBe(expectedAddress)
  })
})
