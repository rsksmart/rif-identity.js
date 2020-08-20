import ganache from 'ganache-cli'
import Web3 from 'web3'
import { rskDIDFromPrivateKey, RSKDIDFromPrivateKeyConf } from '../src/rskDID'

const provider = ganache.provider() as any

describe('rsk did', () => {
  const privateKey = 'c9000722b8ead4ad9d7ea7ef49f2f3c1d82110238822b7191152fbc4849e1891'
  // TODO:
  // const expectedDID = 'did:ethr:rsk:0xda8D79dde799e3FBF0053B7a3aFA6a5D6123cd46'
  // waiting for https://github.com/rsksmart/ethr-did pr
  const expectedDID = 'did:ethr:0x8f4438b78c56B48d9f47c6Ca1be9B69B6fAF9dDa'

  let rskDID: any

  test('no config', () => {
    rskDID = rskDIDFromPrivateKey()(privateKey)
  })

  it('with provider', () => {
    const conf: RSKDIDFromPrivateKeyConf = { provider }
    Object.freeze(conf)
    rskDID = rskDIDFromPrivateKey(conf)(privateKey)
  })

  it('with web3', () => {
    const web3 = new Web3()
    web3.setProvider(provider)
    const conf: RSKDIDFromPrivateKeyConf = { web3 }
    Object.freeze(conf)
    rskDID = rskDIDFromPrivateKey(conf)(privateKey)
  })

  it('with rpc url', () => {
    const conf: RSKDIDFromPrivateKeyConf = { rpcUrl: 'http://localhost:8545' }
    Object.freeze(conf)
    rskDID = rskDIDFromPrivateKey(conf)(privateKey)
  })

  afterEach(() => {
    expect(rskDID.did).toBe(expectedDID)
  })
})

// does not test interaction the registry
