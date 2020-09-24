import ganache from 'ganache-cli'
import Web3 from 'web3'
import { rskDIDFromPrivateKey, rskTestnetDIDFromPrivateKey, RSKDIDFromPrivateKeyConf, RSK_RPC_URL, RSK_TESTNET_RPC_URL } from '../src/rskDID'

const provider = ganache.provider() as any

const privateKey = 'c9000722b8ead4ad9d7ea7ef49f2f3c1d82110238822b7191152fbc4849e1891'
const expectedRSKDID = 'did:ethr:rsk:0x8f4438b78c56B48d9f47c6Ca1be9B69B6fAF9dDa'
const expectedRSKTestnetDID = 'did:ethr:rsk:testnet:0x8F4438b78C56b48d9f47C6cA1Be9B69B6FAF9DdA'

describe.each([
  ['rsk did', rskDIDFromPrivateKey, expectedRSKDID, RSK_RPC_URL],
  ['rsk testnet did', rskTestnetDIDFromPrivateKey, expectedRSKTestnetDID, RSK_TESTNET_RPC_URL]
])('%s', (_, didFromPrivateKey, expectedDID, expectedDefaultRpcUrl) => {
  let rskDID: any

  test('no config', () => {
    rskDID = didFromPrivateKey()(privateKey)

    expect(rskDID.registry.query.rpc.currentProvider.host).toBe(expectedDefaultRpcUrl)
  })

  afterAll(() => new Promise((res, rej) => provider.close((err) => { if (err) rej(err); res() })))

  it('with provider', () => {
    const conf: RSKDIDFromPrivateKeyConf = { provider }
    Object.freeze(conf)
    rskDID = didFromPrivateKey(conf)(privateKey)
  })

  it('with web3', () => {
    const web3 = new Web3()
    web3.setProvider(provider)
    const conf: RSKDIDFromPrivateKeyConf = { web3 }
    Object.freeze(conf)
    rskDID = didFromPrivateKey(conf)(privateKey)
  })

  it('with rpc url', () => {
    const conf: RSKDIDFromPrivateKeyConf = { rpcUrl: 'http://localhost:8545' }
    Object.freeze(conf)
    rskDID = didFromPrivateKey(conf)(privateKey)
  })

  afterEach(() => {
    expect(rskDID.did).toBe(expectedDID)
  })
})

// does not test interaction the registry
