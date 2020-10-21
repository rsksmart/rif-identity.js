import { rskDIDFromPrivateKey } from '@rsksmart/rif-id-ethr-did'
import { mnemonicToSeed, seedToRSKHDKey, generateMnemonic } from '@rsksmart/rif-id-mnemonic'
import { Signer } from 'did-jwt'

export const mockedResFactory = (expectedStatusCode: 200 | 401 | 500, expectedResponse?: string | object) => ({
  send: function (response: string | object) {
    if (expectedResponse) {
      expect(response).toEqual(expectedResponse)
    }
  },
  status: function (statusCode: number) {
    expect(statusCode).toEqual(expectedStatusCode)
    return this
  }
})

export const identityFactory = async (): Promise<{ did: string, signer: Signer }> => {
  const mnemonic = generateMnemonic(12)
  const seed = await mnemonicToSeed(mnemonic)
  const hdKey = seedToRSKHDKey(seed)

  const privateKey = hdKey.derive(0).privateKey.toString('hex')
  return rskDIDFromPrivateKey()(privateKey)
}