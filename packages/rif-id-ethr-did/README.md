<p align="middle">
    <img src="https://www.rifos.org/assets/img/logo.svg" alt="logo" height="100" >
</p>
<h3 align="middle"><code>rif-id-ethr-did</code></h3>
<p align="middle">
    RIF Identity - Ethereum DID
</p>
<p align="middle">
    <a href="https://badge.fury.io/js/%40rsksmart%2Frif-id-ethr-did">
        <img src="https://badge.fury.io/js/%40rsksmart%2Frif-id-ethr-did.svg" alt="npm" />
    </a>
</p>

```
npm i @rsksmart/rif-id-ethr-did
```

## Features

- Manage DID v1.0 compliant identifiers for RSK BIP-44 schema
- Derive RSK DID identifiers from private keys
- Use it with a uPort `ethr-did` compatible interface
- Support RSK Mainnet and Testnet
- Support `Web3Provider`, `Web3,js`, `rpcUrl` or, by default, RKS public nodes.

## Usage

Factory implementation for RSK DID using [`ethr-did`](https://github.com/uport-project/ethr-did) and private keys.

Get an RSK DID using a private key:

```javascript
import { rskDIDFromPrivateKey } from '@rsksmart/rif-id-ethr-did'

const privateKey = '139d64ebceeb8b7702104a13d1d041303bd4a2f42090fa8c0b11c89cb97a5b24'
const rskDID = rskDIDFromPrivateKey()(privateKey)
rskDID.did
// did:ethr:rsk:0x285b30492a3F444D78f75261a35cB292Fc8F41a6
```

Use a it with a custom provider:

```javascript
import Web3 from 'web3'
import { rskDIDFromPrivateKey } from '@rsksmart/rif-id-ethr-did'

let rskDIDFactory

const rpcUrl = 'http://localhost:4444'
rskDIDFactory = rskDIDFromPrivateKey({ rpcUrl })

const web3 = new Web3(rpcUrl)
rskDIDFactory = rskDIDFromPrivateKey({ web3 })

const provider = web3.currentProvider
rskDIDFactory = rskDIDFromPrivateKey({ provider })
```

Use it with RSK Testnet:

```typescript
import { rskTestnetDIDFromPrivateKey } from '@rsksmart/rif-id-ethr-did'

const rskTestnetDID = rskTestnetDIDFromPrivateKey()(privateKey)
rskDID.did
// did:ethr:rsk:testnet:0x285B30492a3F444d78f75261A35cB292Fc8F41A6
```

## Todo

- Provide tests for registry interaction

## Extend

- Support address recovery using other signers than private keys

## Test

From base repo directory run `npm test` or any of the described [test script variants](../../README#test).

## References

- DID v1.0: https://w3c.github.io/did-core/
- uPort DID: https://github.com/uport-project/ethr-did
