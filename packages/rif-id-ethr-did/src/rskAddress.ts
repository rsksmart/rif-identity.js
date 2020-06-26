import { ec as EC } from 'elliptic'
import createKeccakHash from 'keccak'
import { toChecksumAddress } from 'rskjs-util'
import _ from 'lodash'
import pipe from 'lodash/fp/pipe'

const secp256k1 = new EC('secp256k1')

export const ecKeyFromPrivate = (privateKey: string) => secp256k1.keyFromPrivate(privateKey)

export const publicFromEcKey: (ecKey: EC.KeyPair) => Buffer = pipe(
  ecKey => ecKey.getPublic(),
  publicKey => Buffer.concat([
    publicKey.getX().toBuffer(), publicKey.getY().toBuffer()
  ])
)

export const ethereumDigestFromPublicKey = (publicKey: Buffer) => (
  createKeccakHash('keccak256')
    .update(publicKey)
    .digest()
    .toString('hex')
    .slice(-40)
)

export const rskAddressFromEthereumDigest: (address: string) => string = _.partial(toChecksumAddress, _, 30)

export const rskAddressFromPrivateKey: (privateKey: string) => string = pipe(
  ecKeyFromPrivate,
  publicFromEcKey,
  ethereumDigestFromPublicKey,
  rskAddressFromEthereumDigest
)
