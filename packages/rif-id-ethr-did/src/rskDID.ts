import EthrDID from '@rsksmart/ethr-did'
import { rskAddressFromPrivateKey, rskTestnetAddressFromPrivateKey } from './rskAddress'

export const RSK_RPC_URL = 'https://public-node.rsk.co'
export const RSK_TESTNET_RPC_URL = 'https://public-node.testnet.rsk.co'

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
  let confWithAccount = (<any>Object).assign({ method: 'ethr:rsk', privateKey, address }, conf)

  // assign provider
  if (!(conf.provider || conf.web3 || conf.rpcUrl)) {
    confWithAccount = (<any>Object).assign({}, confWithAccount, { rpcUrl: RSK_RPC_URL })
  }

  return new EthrDID(confWithAccount)
}

export const rskTestnetDIDFromPrivateKey: RSKDIDFromPrivateKey = (conf = {}) => (privateKey) => {
  // assign account
  const address = rskTestnetAddressFromPrivateKey(privateKey)
  let confWithAccount = (<any>Object).assign({ method: 'ethr:rsk:testnet', privateKey, address }, conf)

  // assign provider
  if (!(conf.provider || conf.web3 || conf.rpcUrl)) {
    confWithAccount = (<any>Object).assign({}, confWithAccount, { rpcUrl: RSK_TESTNET_RPC_URL })
  }

  return new EthrDID(confWithAccount)
}
