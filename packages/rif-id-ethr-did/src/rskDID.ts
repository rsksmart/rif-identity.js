import EthrDID from 'ethr-did'
import { rskAddressFromPrivateKey } from './rskAddress'

const RSK_RPC_URL = 'https://public-node.rsk.co'

export type RSKDIDFromPrivateKeyConf = {
  [key: string]: any
} & {
  privateKey?: never
  address?: never
  signer?: never
} // extend: support address recovery using other signers than private keys

type RSKDIDFromPrivateKey = (conf?: RSKDIDFromPrivateKeyConf) => (privateKey: string) => any

export const rskDIDFromPrivateKey: RSKDIDFromPrivateKey = (conf = {}) => (privateKey) => {
  // assign account
  const address = rskAddressFromPrivateKey(privateKey)
  const confWithAccount = (<any>Object).assign({}, conf, { privateKey, address })

  // assign provider
  if (!(conf.provider || conf.web3 || conf.rpcUrl)) {
    (<any>Object).assign(confWithAccount, { rpcUrl: RSK_RPC_URL })
  }

  return new EthrDID(confWithAccount)
}
